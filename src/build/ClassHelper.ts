
/// <reference path='../turtlejs/src/part/PartParam.ts'/>
/// <reference path='PartHelper.ts'/>
namespace UIHelper {

    
    function getAttrAndChildsJS(name: string, refNode: VMDOM.VHTMLElement): string {
        let sAttr = refNode.attributesToJS();
        if (sAttr.length !== 0) {
            sAttr = `this.${name}${sAttr};`;
        }
        let s = '';
        s = refNode.childNodesToJS(16).replace(/\.\$$/, '');
        if (s !== '') {
            s = `
            this.${name}${s};`;
        }
        return sAttr + s;
    }
    function initOrder(chds:IArray<VMDOM.VNode>,path:string):boolean{
        let isAllRun:boolean=true;
        treeEach(<VMDOM.VNode[]>chds, "childNodes", (node, state) => {
            if (node instanceof VMDOM.VComment) {
                //解析注释里的命令
                try {
                    let order:Order.VOrder|undefined;
                    if(node instanceof VMDOM.VOrder){
                        order=Order.parseOrder(node);
                    }else{
                        order = Order.parseComment(node);
                    }
                    if (order && order.run) {
                        if (OrderEx.canRunAtService(order)) {
                            //order达成运行所需条件，运行
                            order.run();
                        } else {
                            isAllRun=false;
                            //order未达成运行所需条件，转换为VScript节点
                            OrderEx.toScriptNode(order);
                        }
                    }
                } catch (e) {
                    throw getMakeClassError(path, node, (<Error>e).message, state);
                }
                return eTreeEach.c_noIn;
            }
        });
        return isAllRun;
    }
    function getVMUIInfo(node: VMDOM.VHTMLUnknownElement) {
        let nodeName = node.nodeName;
        // if (nodeName === 'SCRIPT' && getAttr(node, 'type') === 'ui') {
        //     return node.getAttribute('name').toLowerCase();
        // } else 
        if (nodeName.indexOf(':')!==-1) {
            let uiInfo = nodeName.split(':');
            let sortPath = uiInfo[0].toLowerCase();
            if (baseUIPath.hasSortPath(sortPath)) {
                return { sortPath: sortPath, name: uiInfo[1].toLowerCase() };
            }else{
                throw new Error('无法识别组件：'+sortPath+':'+uiInfo[1]);
            }
        }
    }
    
    function init_Ref_Part_Info(chds:IArray<VMDOM.VNode>,props:string[],defaultValues:string[],refInfo:RefInfo,scripts: (VMDOM.VScript&IVNodeMethod)[]){
        treeEach(<VMDOM.VNode[]>chds, "childNodes", (node) => {

            if (node instanceof VMDOM.VHTMLElement) {
                

                //预执行指令
                let directives=node.vmData.directives;
                if(directives){
                    for(const directive of directives){
                        if(directive.defaultValue){
                            props.push(directive.name+'?:string');
                            defaultValues.push(`'${directive.name}'`);
                        }else{
                            props.push(directive.name+':string');
                        }
                    }
                }

                //pre 解析组件
                if(isVHTMLUnknownElement(node)){
                    //解析组件
                    let uiInfo = getVMUIInfo(node);
                    if (uiInfo) {
                        renderVMComponent(node,uiInfo,scripts);
                        
                        // partName = takeAttr(node, 'p-name');


                        // reExtends = takeAttr(node, 're-extends');

                        // outerChildNodes = slice.call(node.childNodes);
                        // outerElement = slice.call(node.children);
                        // let chds = node.childNodes;
                        // for (let i = chds.length; i > 0; i--) {
                        //     node.removeChild(<INode>chds[0]);
                        // }
                        
                        // cpn = ui.render(node, node.parentNode, outerChildNodes, outerElement, null, part, partName, reExtends);
                        // if (cpn) {
                        //     step.next = cpn.elementLength;
                        // }
                        return eTreeEach.c_noIn | eTreeEach.c_noRepeat;
                    }
                    //after 解析组件
                }
                

                //解析ref
                let v = node.getAttribute("ref");
                if (v) {
                    refInfo.push(v, <any>node);
                    node.removeAttribute("ref");
                }
                //解析class
            } else if (node instanceof VMDOM.VScript) {
                scripts.push(<any>node);
            }
        });
    }

    //获取vscript.toFunction
    function scriptsToString(scripts: VMDOM.VScript[]){
        let scriptFunctions:string='';
        let functionHash:{[index:string]:VMDOM.VScript}={}
        let index=0;
        for (let i = scripts.length - 1; i >= 0; i--) {
            let script = scripts[i];
            // let p = <VMDOM.VElement & IVNodeMethod>scripts[i].parentNode;
            let name = 'order' + index;
            let hashScript=functionHash[script.toFunction()];
            if(hashScript){
                script.propertyName=hashScript.propertyName;
            }else{
                functionHash[script.toFunction()]=script;
                script.propertyName = name;
                scriptFunctions += '\n        ' + script.toFunction();
                index++;
            }
        }
        return scriptFunctions;
    }
    function replaceToMember(refInfo:RefInfo,propertys: string[],names: string[],vars: string[],propertyInitScript: { [index: string]: string }){
        
        for (const info of refInfo.data) {
            if (info.refs.length > 1) {
                //缓存parent;
                let refParent = info.refParent;
                for (const ref of info.refs) {
                    let name = ref.name;
                    let refNode: VMDOM.VElement & IVNodeMethod = ref.node;
                    let mem = $$$(name, ENodeType.Member);
                    replaceNodeByNode(refNode, mem);
                    names.push(name);
                    propertys.push(name + ':' + toClassName(refNode));
                }
                let p = refParent.parentNode;
                if (!p) {
                    let refName = refInfo.getRefNodeName(refParent);
                    if (refName === null) {
                        throw new Error('未知错误！');
                    }
                } else {
                    let parentName = RefInfo.getRefParentName(info.refs);
                    let mem = $$$(parentName, ENodeType.Member);
                    mem.isVar = true;
                    replaceNodeByNode(refParent, mem);
                    names.push(parentName);
                    vars.push(parentName + ':' + toClassName(refParent));
                }
            } else {
                //只拆一次
                let refInfo = info.refs[0];
                let name = refInfo.name;
                let refNode: VMDOM.VElement & IVNodeMethod = <any>refInfo.node;
                let p = <VMDOM.VElement & IVNodeMethod>refNode.parentNode;
                p.insertBefore($$$(name, ENodeType.Member), refNode);
                p.removeChild(refNode);
                names.push(name);
                propertys.push(name + ':' + toClassName(refNode));
            }
        }
        function setPropertyInitScript(name:string,node:VMDOM.VHTMLElement){
            propertyInitScript[name] = `this.${name}=<any>$$$${
                        node.toCreateJS()
                        };
            `+ getAttrAndChildsJS(name, node);
        }
        //生成代码
        for (const info of refInfo.data) {
            if (info.refs.length > 1) {
                //缓存parent;
                let refParent = info.refParent;
                for (const ref of info.refs) {
                    setPropertyInitScript(ref.name,ref.node);
                }
                let p = refParent.parentNode;
                if (p) {
                    setPropertyInitScript(RefInfo.getRefParentName(info.refs),refParent);
                }
            } else {
                //只拆一次
                let refInfo = info.refs[0];
                setPropertyInitScript(refInfo.name,refInfo.node);
            }
        }
    }
    let nameMatch=/[\s\S]*[\/\\](.*?)[\/\\].*?$/;

    /**生成Class.ts代码文件 */
    export function makeClass(this: void, path: string, className?: string) {
        baseUIPath.push('{ui:"ui"}');
        if (!className) {
            className = path.match(nameMatch)[1];
        }
        className = className[0].toUpperCase() + className.substr(1).toLowerCase();
        let html = fs.readFileSync(path);
        if (!isString(html)) {
            html = html.toString();
        }
        let dom = VDOM2.parseStructor(html);
        let tops: VMDOM.VNode[];
        let chds: IArray<VMDOM.VNode>;
        if (isArray(dom)) {
            chds = dom;
            tops = dom
        } else {
            chds = dom.childNodes;
            tops = [dom];
        }
    //1.初始化 Order
        // let isAllRun=
        initOrder(chds,path);
        
        let refInfo = new RefInfo;
        let scripts: (VMDOM.VScript&IVNodeMethod)[] = [];
        // let paramInfos:PartParam[]=[];
        let props:string[]=[];
        let defaultValues:string[]=[];
        
    //2.初始化  ref
        init_Ref_Part_Info(chds,props,defaultValues,refInfo,scripts);

        let scriptFunctions: string = scriptsToString(scripts);
        
        let propertys: string[] = [];
        let names: string[] = [];
        let vars: string[] = [];
        let propertyInitScript: { [index: string]: string } = {};
        //替换节点为mem
        replaceToMember(refInfo,propertys,names,vars,propertyInitScript);

        let topsJS: string[] = [];
        let topsType: string[] = [];
        for (const top of tops) {
            topsJS.push(top.toJSString(16));
            topsType.push(toClassName(top));
        }


        //初始化dom
        let domInitScript: string = '';
        for (let i = names.length - 1; i >= 0; i--) {
            let name = names[i];
            domInitScript += '\n            ' + propertyInitScript[name];
        }

        if (topsJS.length > 0) {
            propertys.push(getViewPropertyInfoString(topsType));
            domInitScript += getViewInitDOMString(topsJS);
        }
        //字符串替换为const
        let allString:string[]=[];
        domInitScript=domInitScript.replace(/".*?"|'.*?'|`.*?`/g,function(s:string){
            let idx=allString.indexOf(s);
            if(idx===-1){
                allString.push(s);
                return 'S'+(allString.length-1);
            }else{
                return 'S'+idx;
            }
        });
        if(allString.length>0){
            for(let i=0;i<allString.length;i++){
                allString[i]='S'+i+'='+ allString[i]
            }
            domInitScript='let '+allString.join(',')+';\n        '+domInitScript;
        }

        //回调函数合并

        let propertyInfo: string = propertys.join(';\n        ');
        let varInfo: string = vars.join(';\n            ');
        let propsInfo:string=props.join('\n        ');
        let defaultValuesInfo:string=defaultValues.join(',');
        fs.writeFileSync(
            path.replace(/View\.html$/, 'View.ts'), 
            getViewString(className, propertyInfo, varInfo, domInitScript, scriptFunctions,propsInfo,defaultValuesInfo)
        );

        //mixin .css  to  变量
    }

    function getMakeClassError(path: string, node: IComment, message: string, state: ITreeEachState<INode>): string {
        let stack = state.stack;
        let strStack = '    at ' + path + '\n';
        for (let i = 0; i < stack.length; i += 2) {
            let arr: INode[] = <INode[]>stack[i];
            let index: number = <number>stack[i + 1];
            // let info: string[] = [];
            strStack = '    at childNodes.' + index + ':' + arr[index].nodeName + '\n' + strStack;
        }
        strStack = '    at childNodes.' + state.currentIndex + ':' + node.data + '\n' + strStack;

        return 'Error:' + message + '\n' + strStack;
    }

}
