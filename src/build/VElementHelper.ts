class VElementHelper{
    private static build(name:string,datas:string[]){
        let decorates:string[]=[];
        for(let i in datas){
            decorates.push(datas[i]);
        }
        let className=`V${name[0]+name.substr(1).toLowerCase()}Element`;
        let propertys=decorates.join(`:string
        `)+':string';
        return `
interface IVNodeMethod{
    (nodeName: "${name.toLowerCase()}", nodeType?: ENodeType.Element): VMDOM.${className}&IVNodeMethod;
}
namespace VMDOM{
    export class ${className} extends VHTMLElement{
        nodeName="${name.toUpperCase()}"
        ${propertys}
    }
    VAP.decorate(${className},[${'"'+decorates.join('","')+'"'}]);
}`
    }
    private static checkAttr_Prop(name:string){
        let elem=document.createElement(name);
        let names:string[]=[];
        for(let i in elem){
            elem.setAttribute(i,"1");
            if((<any>elem)[i]==="1"){
                names.push(i);
            }
        }
        return names;
    }
    static buildByName(name:string):string{
        return this.build(name.toUpperCase(),this.checkAttr_Prop(name));
    }
}
