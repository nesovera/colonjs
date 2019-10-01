class Colon{
    constructor(params={}){
        // Attach params values to the instance
        this.root = params.root || this;
        this.parent = params.parent;
        this.props = params.props || {};
        this.data = (typeof params.data === "function") ? params.data() : (params.data || {});
        this.methods = (typeof params.methods === "function") ? params.methods() : (params.methods || {});
        this.loopScope = params.loopScope || [];
        this.directives = params.directives || {};
        // Make all component names lowercase
        this.components = Object.entries(params.components || {}).reduce((acc,[k,v])=>(acc[k.toLowerCase()]=v, acc),{});
        // If params has template variable create 'el' and attach to the instance
        if(typeof params.el === "string"){
            this.el = params.el = document.querySelector(params.el);
        }
        if(params.template){
            this.el = params.el || document.createElement("template");
            if(typeof params.template === 'string') this.el.innerHTML = params.template;
            if(Array.isArray(params.template)) params.template.forEach(v=>this.el.appendChild(v));
        }
        this.el = this.el || params.el;
        if(!this.el) return console.error("Colon root element not found");
        // If not a recursive instance, 'this' is bound to functions in data, methods and directives
        // If a recursive instance, directives will have the initial instance's 'this'
        if(!params.recursive){
            Object.entries(this.methods).forEach(([k,v])=>{ if(typeof v ==="function") this.methods[k] = v.bind(this); });
            Object.entries(this.directives).forEach(([k,v])=>{ this.directives[k] = v.bind(this); });
        }
        // Bind 'this' to lifecycle event functions
        ["created","beforeUpdate","updated","mounted","destroyed"].map((v)=>{ this[v] = (params[v] || (()=>{})).bind(this); });

        // Insert [__CJSSTYLE] style to enable :show directive.
        if(!window.__CJSSTYLE){ window.__CJSSTYLE = this.insertStyle("[__CJSHIDE]{ display:none !important }"); }

        // Call lifecycle event 'created'
        this.created();
        // Create template tree
        const createTemplateTree = (node,parent) =>{
            if(node.nodeName === "#text") return node.textContent;
            return ({
                node,parent,
                type:node.nodeName.replace(/-/g,"").toLowerCase(),
                attrs: this.getNodeAttrs(node) ,
                children: this.getChildNodes(node).map(v=>createTemplateTree(v,node)),
                events:[]
            });
        };
        this.templateTree = createTemplateTree( this.el, null );
        // Do the initial rendering
        this.render();
        // Call lifecycle event 'mounted'
        this.mounted();
    }

    // Helper Functions
    insertStyle(style){ return ((d,e)=>{e = d.createElement("style");e.innerHTML = style; d.head.appendChild(e); return e; })(document); }
    isObject(obj){ return typeof obj === "object" && !Array.isArray(obj) && obj !== null; }
    getContent(node){ return node.nodeName.toLowerCase() === "template" ? (node.content || node) : node;}
    getChildNodes(node){ return Array.from(this.getContent(node).childNodes).filter(v=>!/^(SCRIPT|STYLE)$/.test(v.nodeName)); }
    getNodeAttrs(node){ return Array.from(node.attributes||[]).reduce((a,v)=>{ a[v.nodeName] = v.nodeValue; return a; },{}); }
    nodeToArray(node){ return node.nodeName.toLowerCase() === "template" ? this.getChildNodes(node) : [node]; }
    attrExist($attrs,list){ return list.filter(v=>Object.keys($attrs).indexOf(v)>=0).length; }
    setAttr(node,attr,newValue){
        if( ( typeof newValue === "boolean" && !newValue ) || typeof newValue === "undefined" ) return node.removeAttribute(attr);
        node.setAttribute(attr,newValue);
    }
    // eval() code after creating environment variables
    /* eslint-disable no-unused-vars */
    run($code,{$multi=false,$arguments,$event,$this}={}){
        var $app = this;
        var $data = $app.data,
            $methods = $app.methods,
            $root = $app.root,
            $parent = $app.parent,
            $props = $app.props,
            $loopScope = $app.loopScope;
        var loopVars =  $loopScope.map(({keyVar,keyValue,valVar},i)=>(
            (keyVar?`var ${keyVar} = ${JSON.stringify(keyValue)};`:``) +
            `var ${valVar} = $loopScope[${i}].arr.find(function(v){return v[0]===${JSON.stringify(keyValue)}})[1];`
        )).join("");
        return eval(loopVars + ($multi?$code:`(${$code})`));
    }
    /* eslint-enable no-unused-vars */
    // Diff Functions
    diffArray(parent, placeHolder, oldArr, newArr){
        if(!oldArr) oldArr = [];
        if(!newArr) newArr = [];
        for (let i=0; i < Math.max(oldArr.length,newArr.length); i++){
            let newNode = this.diffNode(parent, placeHolder, oldArr[i],newArr[i]);
            if(newNode) newArr[i] = newNode;
        }
        return newArr;
    }
    diffNode( parent, placeHolder, oldNode, newNode ){
        if(!oldNode && newNode) return this.getContent(parent).insertBefore(newNode, placeHolder || null);
        if(oldNode && !newNode){ this.getContent(parent).removeChild(oldNode); return null; }
        if(oldNode.nodeName != newNode.nodeName) { this.getContent(parent).replaceChild(newNode,oldNode); return newNode; }
        if(oldNode.nodeType === Node.TEXT_NODE && newNode.nodeType === Node.TEXT_NODE){
            if(oldNode.nodeValue !== newNode.nodeValue) oldNode.nodeValue = newNode.nodeValue;
        }else{
            let oldAttrs = this.getNodeAttrs(oldNode);
            let newAttrs = this.getNodeAttrs(newNode);
            Object.keys({...oldAttrs, ...newAttrs}).map(k=>this.diffAttr(oldNode,k,oldAttrs[k], newAttrs[k]))
            this.diffArray( oldNode, null, Array.from(oldNode.childNodes), Array.from(newNode.childNodes) );
        }
        return oldNode;
    }
    diffAttr(node,attr,oldValue,newValue){
        if(oldValue === null) oldValue = node.getAttribute(attr);
        if(oldValue === newValue) return;
        this.setAttr(node,attr,newValue)
    }
    // Function to remove node and add placeholder for :for, :if, <slot>, and custom components
    addPlaceHolder(treeNode,name){
        if(treeNode.cloneNode) return;
        treeNode.placeHolder = this.getContent(treeNode.parent).insertBefore(document.createComment('<'+name+'>'), treeNode.node);
        treeNode.cloneNode = treeNode.node.cloneNode(true);
        this.getContent(treeNode.parent).removeChild(treeNode.node);
        treeNode.children = treeNode.node = null;
    }
    // Render one node of the template tree.
    renderTreeNode(treeNode){
        let $app = this,
            $this = treeNode.node,
            $parentNode = treeNode.parent,
            $type = treeNode.type,
            $attrs = treeNode.attrs,
            $children = treeNode.children;
        // If node has attribute :pre, do not process
        if(this.attrExist($attrs,[":pre"])) return;
        // Handle if node is a component
        if(this.components[$type]){
            this.addPlaceHolder(treeNode,$type);
            let props = Object.entries($attrs).map(([k,v])=> (k.charAt(0)===":")?[k.slice(1),this.run(v)]:[k,v]).reduce((acc,[k,v])=>{ acc[k]=v; return acc; },{});
            props.children = treeNode.cloneNode.cloneNode(true);
            if(treeNode.instance){
                treeNode.instance.render();
            }else{
                treeNode.instance = new Colon({ props, root:this.root, parent:this, ...this.components[$type] });
                const componentNode = treeNode.instance.el;
                treeNode.renderedChildren = this.diffArray( $parentNode, treeNode.placeHolder, treeNode.renderedChildren, componentNode ? this.nodeToArray(componentNode) : [] );
            }
            return;
        }
        if($type === "slot" ){
            // Handle <slot> in component
            this.addPlaceHolder(treeNode,"slot");
            const childNodes = this.getChildNodes(this.props.children.cloneNode(true));
            new Colon({ template: childNodes, recursive:true, root:this.root, parent:this, props:this.props, data:this.data, methods:this.methods, directives:this.directives, components:this.components, loopScope: this.loopScope });
            treeNode.renderedChildren = this.diffArray( $parentNode, treeNode.placeHolder, treeNode.renderedChildren, childNodes);
            return;
        }
        // Cycle through all the attributes that start with : or @
        Object.entries($attrs)
            .filter(([k])=>/^[:@]/.test(k))
            .forEach(([$attr,$value])=>{
                // If node has :for or :if, do not process anything other than :for or :if
                if(this.attrExist($attrs,[":for",":if"]) && !/^:(for|if)$/.test($attr)) return;
                // Remove the : or @ from the attribute name
                let attr = $attr.slice(1);
                // Remove the attribute with : or @ from DOM since it is unnecessary
                if($this && typeof $this.getAttribute($attr) !== "undefined") $this.removeAttribute($attr);
                if(/^@/.test($attr)){
                    // If the attribute starts with @, add it as an event listener
                    if(treeNode.events.indexOf(attr)>=0) return;
                    $this.addEventListener(attr,(...$arguments)=>{ this.run($value,{$multi:true,$arguments,$event:$arguments[0],$this}); this.render(); },false)
                    treeNode.events.push(attr);
                }else if($attr===":for"){
                    // Handle :for
                    let [valVar,keyVar,list] = $value.match(/^\s*([^\s,]+)(?:\s*,\s*([^\s,]+))?\s+in\s+(.+)/).slice(1);
                    this.addPlaceHolder(treeNode,":for");
                    list = this.run(list,{$this}) || [];
                    if(Array.isArray(list)) list = list.map((v,k)=>[k,v]);
                    if(this.isObject(list)) list = Object.entries(list);
                    list = list.reduce((acc,[keyValue],i,arr) => {
                        // Create a new Colon instance for each row of the list and render
                        let newNodeClone = treeNode.cloneNode.cloneNode(true);
                        new Colon({ el: newNodeClone, recursive:true, root:this.root, parent:this.parent, props:this.props, data:this.data, methods:this.methods, directives:this.directives, components:this.components, loopScope: [ ...this.loopScope, {arr,keyVar,keyValue,valVar} ] });
                        acc.push(...this.nodeToArray(newNodeClone));
                        return acc;
                    },[]);
                    treeNode.renderedChildren = this.diffArray($parentNode, treeNode.placeHolder, treeNode.renderedChildren, list);
                }else if($attr===":if"){
                    // Handle :if
                    this.addPlaceHolder(treeNode,":if");
                    let newNodeClone;
                    if(this.run($value,{$this})){
                        newNodeClone = treeNode.cloneNode.cloneNode(true);
                        new Colon({ el: newNodeClone, recursive:true, root:this.root, parent:this.parent, props:this.props, data:this.data, methods:this.methods, directives:this.directives, components:this.components, loopScope: this.loopScope });
                    }
                    treeNode.renderedChildren = this.diffArray( $parentNode, treeNode.placeHolder, treeNode.renderedChildren, newNodeClone ? this.nodeToArray(newNodeClone) : []);
                }else if(/^:(class|style)$/.test($attr)){
                    // Handle :class and :style
                    let isClass = attr==="class";
                    let newValue = this.run($value,{$this}) || "";
                    if(Array.isArray(newValue)) newValue = newValue.join(isClass ?" ":";");
                    if(this.isObject(newValue)) newValue = Object.entries(newValue).reduce((acc,[k,v])=>`${acc} ${isClass?(v?k:''):(`${k}:${v};`)}`,"");
                    let styleString = `${$attrs[attr]||''}${isClass?" ":";"}${newValue||''}`.trim();
                    this.diffAttr($this,attr,null,styleString);
                }else if($attr===":show"){
                    // Handle :show
                    let newValue = this.run($value,{$this});
                    $this[newValue?'removeAttribute':'setAttribute']('__CJSHIDE',newValue);
                }else if(/^:(html|text|json)$/.test($attr)){
                    // Handle :html, :text, :json
                    if(!$this) return;
                    let newValue = this.run($value,{$this});
                    if(attr==="json") newValue = JSON.stringify(newValue,null,2)
                    if(newValue===null || typeof newValue === 'undefined') newValue = "";
                    let prop = attr==="html" ? "innerHTML" : "innerText";
                    if($this[prop] !== newValue) $this[prop] = newValue;
                }else if($attr){
                    // Run all the matching directives for the attribute
                    if(Object.entries(this.directives).filter(([k,v])=>{
                        if((new RegExp(k)).test($attr)){
                            v({$app,$attr,$value,$this,$parentNode});
                            return true;
                        }
                    }).length) return;
                    // If there are no directives, run the code and set it as an attribute.
                    let newValue = this.run($value,{$this});
                    //if(/^:/.test(attr)) attr = attr.slice(1);
                    this.diffAttr($this,attr,null,newValue);
                }
            });
        // If node does not have :for or :if, process all its non string children
        if( !this.attrExist($attrs,[":for",":if"]) ) $children.filter(v=>typeof v !== "string").forEach( this.renderTreeNode.bind(this) );
    }
    // Render template tree.
    render(){
        // Call lifecycle event 'beforeUpdate'
        this.beforeUpdate();
        // Initiate render for template tree.
        this.renderTreeNode(this.templateTree);
        // Call lifecycle event 'updated'
        this.updated();
    }
}
export default Colon;