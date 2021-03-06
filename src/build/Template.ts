
namespace UIHelper{
    

    export function getScriptString(className:string){
        return `/// <reference path="Class.ts"/>

function ${className}(part:${className}){
    //todo:这里填写组件代码
}`
    }

    

    export function getClassString(className:string){
        return `/// <reference path="View.ts"/>

//本模块由引擎生成，请勿手动修改此文件
//生成时间:${(new Date()).toString()}

class ${className} extends Component.Part{
    constructor(
        public props:I${className}Props,
        public outerChildNodes?:(VMDOM.VNode&IVNodeMethod)[]
    ) {
        super("${className.toLowerCase()}",new ${className}View,props,outerChildNodes);
        init${className}(this);
    }
}`
    }
    export function getViewString(
        className:string,
        propertyInfo:string,
        varInfo:string,
        domInitScript:string,
        scripts:string,
        props:string,
        defaultValuesInfo:string
    ){
        return `/// <reference path="../lib.d.ts"/>

//本模块由引擎生成，请勿手动修改此文件
//生成时间:${(new Date()).toString()}

interface I${className}Props extends ComponentView.IProps{
    ${props}
}
class ${className}View implements ComponentView.IView{${defaultValuesInfo!==''?`
    static defaultValuesInfo=[${defaultValuesInfo}];`:``}
    ${propertyInfo}
    initDOM(props:I${className}Props,nodes?:(VMDOM.VNode&IVNodeMethod)[]){
        ${varInfo}${domInitScript}
        ${scripts!==''?`
        ${scripts}`:''}
    }
}

`
    }
    export function getViewPropertyInfoString(topsType:string[]){
        return `tops:[${topsType.join('\n,')}]=<any>[];`
    }
    export function getViewInitDOMString(topsJS:string[]){
        return `
        push.call(this.tops=<any>[],<(VMDOM.VNode&IVNodeMethod)>
            ${topsJS.join(',\n                    <(VMDOM.VNode&IVNodeMethod)>')}
        );`
    }
}