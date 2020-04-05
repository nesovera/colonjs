/*!
 * ColonJs v0.0.15
 * (c) 2018-2020 NesoVera (nesovera@gmail.com)
 * Released under the MIT License.
 */

(function (global, factory) {
  typeof exports === 'object' && typeof module !== 'undefined' ? module.exports = factory() :
  typeof define === 'function' && define.amd ? define(factory) :
  (global = global || self, global.Colon = factory());
}(this, (function () { 'use strict';

  // https://tc39.github.io/ecma262/#sec-array.prototype.find
  if (!Array.prototype.find) {
    Object.defineProperty(Array.prototype, 'find', {
      value: function value(predicate) {
        // 1. Let O be ? ToObject(this value).
        if (this == null) {
          throw TypeError(''); //"this" is null or not defined
        }

        var o = Object(this); // 2. Let len be ? ToLength(? Get(O, "length")).

        var len = o.length >>> 0; // 3. If IsCallable(predicate) is false, throw a TypeError exception.

        if (typeof predicate !== 'function') {
          throw TypeError(''); //predicate must be a function
        } // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.


        var thisArg = arguments[1]; // 5. Let k be 0.

        var k = 0; // 6. Repeat, while k < len

        while (k < len) {
          // a. Let Pk be ! ToString(k).
          // b. Let kValue be ? Get(O, Pk).
          // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
          // d. If testResult is true, return kValue.
          var kValue = o[k];

          if (predicate.call(thisArg, kValue, k, o)) {
            return kValue;
          } // e. Increase k by 1.


          k++;
        } // 7. Return undefined.


        return undefined;
      },
      configurable: true,
      writable: true
    });
  }

  if (!Array.from) {
    Array.from = function () {
      var toStr = Object.prototype.toString;

      var isCallable = function isCallable(fn) {
        return typeof fn === 'function' || toStr.call(fn) === '[object Function]';
      };

      var toInteger = function toInteger(value) {
        var number = Number(value);

        if (isNaN(number)) {
          return 0;
        }

        if (number === 0 || !isFinite(number)) {
          return number;
        }

        return (number > 0 ? 1 : -1) * Math.floor(Math.abs(number));
      };

      var maxSafeInteger = Math.pow(2, 53) - 1;

      var toLength = function toLength(value) {
        var len = toInteger(value);
        return Math.min(Math.max(len, 0), maxSafeInteger);
      }; // The length property of the from method is 1.


      return function from(arrayLike
      /*, mapFn, thisArg */
      ) {
        // 1. Let C be the this value.
        var C = this; // 2. Let items be ToObject(arrayLike).

        var items = Object(arrayLike); // 3. ReturnIfAbrupt(items).

        if (arrayLike == null) {
          throw new TypeError(''); //Array.from requires an array-like object - not null or undefined
        } // 4. If mapfn is undefined, then let mapping be false.


        var mapFn = arguments.length > 1 ? arguments[1] : void undefined;
        var T;

        if (typeof mapFn !== 'undefined') {
          // 5. else
          // 5. a If IsCallable(mapfn) is false, throw a TypeError exception.
          if (!isCallable(mapFn)) {
            throw new TypeError(''); //Array.from: when provided, the second argument must be a function
          } // 5. b. If thisArg was supplied, let T be thisArg; else let T be undefined.


          if (arguments.length > 2) {
            T = arguments[2];
          }
        } // 10. Let lenValue be Get(items, "length").
        // 11. Let len be ToLength(lenValue).


        var len = toLength(items.length); // 13. If IsConstructor(C) is true, then
        // 13. a. Let A be the result of calling the [[Construct]] internal method
        // of C with an argument list containing the single item len.
        // 14. a. Else, Let A be ArrayCreate(len).

        var A = isCallable(C) ? Object(new C(len)) : new Array(len); // 16. Let k be 0.

        var k = 0; // 17. Repeat, while k < len… (also steps a - h)

        var kValue;

        while (k < len) {
          kValue = items[k];

          if (mapFn) {
            A[k] = typeof T === 'undefined' ? mapFn(kValue, k) : mapFn.call(T, kValue, k);
          } else {
            A[k] = kValue;
          }

          k += 1;
        } // 18. Let putStatus be Put(A, "length", len, true).


        A.length = len; // 20. Return A.

        return A;
      };
    }();
  }

  if (!Object.entries) {
    Object.entries = function (obj) {
      var ownProps = Object.keys(obj),
          i = ownProps.length,
          resArray = new Array(i); // preallocate the Array

      while (i--) {
        resArray[i] = [ownProps[i], obj[ownProps[i]]];
      }

      return resArray;
    };
  }

  function _extends() {
    _extends = Object.assign || function (target) {
      for (var i = 1; i < arguments.length; i++) {
        var source = arguments[i];

        for (var key in source) {
          if (Object.prototype.hasOwnProperty.call(source, key)) {
            target[key] = source[key];
          }
        }
      }

      return target;
    };

    return _extends.apply(this, arguments);
  }

  var Colon = /*#__PURE__*/function () {
    function Colon(params) {
      var _this = this;

      if (params === void 0) {
        params = {};
      }

      // Attach params values to the instance
      this.root = params.root || this;
      this.parent = params.parent;
      this.props = params.props || {};
      this.data = typeof params.data === "function" ? params.data() : params.data || {};
      this.methods = typeof params.methods === "function" ? params.methods() : params.methods || {};
      this.loopScope = params.loopScope || [];
      this.directives = params.directives || {}; // Make all component names lowercase

      this.components = Object.entries(params.components || {}).reduce(function (acc, _ref) {
        var k = _ref[0],
            v = _ref[1];
        return acc[k.toLowerCase()] = v, acc;
      }, {}); // If params has template variable create 'el' and attach to the instance

      if (typeof params.el === "string") {
        this.el = params.el = document.querySelector(params.el);
      }

      if (params.template) {
        this.el = params.el || document.createElement("template");
        if (typeof params.template === 'string') this.el.innerHTML = params.template;
        if (Array.isArray(params.template)) params.template.forEach(function (v) {
          return _this.el.appendChild(v);
        });
      }

      this.el = this.el || params.el;
      if (!this.el) return console.error("Colon root element not found"); // If not a recursive instance, 'this' is bound to functions in data, methods and directives
      // If a recursive instance, directives will have the initial instance's 'this'

      if (!params.recursive) {
        Object.entries(this.methods).forEach(function (_ref2) {
          var k = _ref2[0],
              v = _ref2[1];
          if (typeof v === "function") _this.methods[k] = v.bind(_this);
        });
        Object.entries(this.directives).forEach(function (_ref3) {
          var k = _ref3[0],
              v = _ref3[1];
          _this.directives[k] = v.bind(_this);
        });
      } // Bind 'this' to lifecycle event functions


      ["created", "beforeUpdate", "updated", "mounted", "destroyed"].map(function (v) {
        _this[v] = (params[v] || function () {}).bind(_this);
      }); // Insert [__CJSSTYLE] style to enable :show directive.

      if (!window.__CJSSTYLE) {
        window.__CJSSTYLE = this.insertStyle("[__CJSHIDE]{ display:none !important }");
      } // Call lifecycle event 'created'


      this.created(); // Create template tree

      var createTemplateTree = function createTemplateTree(node, parent) {
        if (node.nodeName === "#text") return node.textContent;
        return {
          node: node,
          parent: parent,
          type: node.nodeName.replace(/-/g, "").toLowerCase(),
          attrs: _this.getNodeAttrs(node),
          children: _this.getChildNodes(node).map(function (v) {
            return createTemplateTree(v, node);
          }),
          events: []
        };
      };

      this.templateTree = createTemplateTree(this.el, null); // Do the initial rendering

      this.render(); // Call lifecycle event 'mounted'

      this.mounted();
    } // Helper Functions


    var _proto = Colon.prototype;

    _proto.insertStyle = function insertStyle(style) {
      return function (d, e) {
        e = d.createElement("style");
        e.innerHTML = style;
        d.head.appendChild(e);
        return e;
      }(document);
    };

    _proto.isObject = function isObject(obj) {
      return typeof obj === "object" && !Array.isArray(obj) && obj !== null;
    };

    _proto.getContent = function getContent(node) {
      return node.nodeName.toLowerCase() === "template" ? node.content || node : node;
    };

    _proto.getChildNodes = function getChildNodes(node) {
      return Array.from(this.getContent(node).childNodes).filter(function (v) {
        return !/^(SCRIPT|STYLE)$/.test(v.nodeName);
      });
    };

    _proto.getNodeAttrs = function getNodeAttrs(node) {
      return Array.from(node.attributes || []).reduce(function (a, v) {
        a[v.nodeName] = v.nodeValue;
        return a;
      }, {});
    };

    _proto.nodeToArray = function nodeToArray(node) {
      return node.nodeName.toLowerCase() === "template" ? this.getChildNodes(node) : [node];
    };

    _proto.attrExist = function attrExist($attrs, list) {
      return list.filter(function (v) {
        return Object.keys($attrs).indexOf(v) >= 0;
      }).length;
    };

    _proto.setAttr = function setAttr(node, attr, newValue) {
      if (typeof newValue === "boolean" && !newValue || typeof newValue === "undefined") return node.removeAttribute(attr);
      node.setAttribute(attr, newValue);
    } // eval() code after creating environment variables

    /* eslint-disable no-unused-vars */
    ;

    _proto.run = function run($code, _temp) {
      var _ref4 = _temp === void 0 ? {} : _temp,
          _ref4$$multi = _ref4.$multi,
          $multi = _ref4$$multi === void 0 ? false : _ref4$$multi,
          $arguments = _ref4.$arguments,
          $event = _ref4.$event,
          $this = _ref4.$this;

      var $app = this;
      var $data = $app.data,
          $methods = $app.methods,
          $root = $app.root,
          $parent = $app.parent,
          $props = $app.props,
          $loopScope = $app.loopScope;
      var loopVars = $loopScope.map(function (_ref5, i) {
        var keyVar = _ref5.keyVar,
            keyValue = _ref5.keyValue,
            valVar = _ref5.valVar;
        return (keyVar ? "var " + keyVar + " = " + JSON.stringify(keyValue) + ";" : "") + ("var " + valVar + " = $loopScope[" + i + "].arr.find(function(v){return v[0]===" + JSON.stringify(keyValue) + "})[1];");
      }).join("");
      return eval(loopVars + ($multi ? $code : "(" + $code + ")"));
    }
    /* eslint-enable no-unused-vars */
    // Diff Functions
    ;

    _proto.diffArray = function diffArray(parent, placeHolder, oldArr, newArr) {
      if (!oldArr) oldArr = [];
      if (!newArr) newArr = [];

      for (var i = 0; i < Math.max(oldArr.length, newArr.length); i++) {
        var newNode = this.diffNode(parent, placeHolder, oldArr[i], newArr[i]);
        if (newNode) newArr[i] = newNode;
      }

      return newArr;
    };

    _proto.diffNode = function diffNode(parent, placeHolder, oldNode, newNode) {
      var _this2 = this;

      if (!oldNode && newNode) return this.getContent(parent).insertBefore(newNode, placeHolder || null);

      if (oldNode && !newNode) {
        this.getContent(parent).removeChild(oldNode);
        return null;
      }

      if (oldNode.nodeName != newNode.nodeName) {
        this.getContent(parent).replaceChild(newNode, oldNode);
        return newNode;
      }

      if (oldNode.nodeType === Node.TEXT_NODE && newNode.nodeType === Node.TEXT_NODE) {
        if (oldNode.nodeValue !== newNode.nodeValue) oldNode.nodeValue = newNode.nodeValue;
      } else {
        var oldAttrs = this.getNodeAttrs(oldNode);
        var newAttrs = this.getNodeAttrs(newNode);
        Object.keys(_extends({}, oldAttrs, {}, newAttrs)).map(function (k) {
          return _this2.diffAttr(oldNode, k, oldAttrs[k], newAttrs[k]);
        });
        this.diffArray(oldNode, null, Array.from(oldNode.childNodes), Array.from(newNode.childNodes));
      }

      return oldNode;
    };

    _proto.diffAttr = function diffAttr(node, attr, oldValue, newValue) {
      if (oldValue === null) oldValue = node.getAttribute(attr);
      if (oldValue === newValue) return;
      this.setAttr(node, attr, newValue);
    } // Function to remove node and add placeholder for :for, :if, <slot>, and custom components
    ;

    _proto.addPlaceHolder = function addPlaceHolder(treeNode, name) {
      if (treeNode.cloneNode) return;
      treeNode.placeHolder = this.getContent(treeNode.parent).insertBefore(document.createComment('<' + name + '>'), treeNode.node);
      treeNode.cloneNode = treeNode.node.cloneNode(true);
      this.getContent(treeNode.parent).removeChild(treeNode.node);
      treeNode.children = treeNode.node = null;
    } // Render one node of the template tree.
    ;

    _proto.renderTreeNode = function renderTreeNode(treeNode) {
      var _this3 = this;

      var $app = this,
          $this = treeNode.node,
          $parentNode = treeNode.parent,
          $type = treeNode.type,
          $attrs = treeNode.attrs,
          $children = treeNode.children; // If node has attribute :pre, do not process

      if (this.attrExist($attrs, [":pre"])) return; // Handle if node is a component

      if (this.components[$type]) {
        this.addPlaceHolder(treeNode, $type);
        var props = Object.entries($attrs).map(function (_ref6) {
          var k = _ref6[0],
              v = _ref6[1];
          return k.charAt(0) === ":" ? [k.slice(1), _this3.run(v)] : [k, v];
        }).reduce(function (acc, _ref7) {
          var k = _ref7[0],
              v = _ref7[1];
          acc[k] = v;
          return acc;
        }, {});
        props.children = treeNode.cloneNode.cloneNode(true);

        if (treeNode.instance) {
          treeNode.instance.render();
        } else {
          treeNode.instance = new Colon(_extends({
            props: props,
            root: this.root,
            parent: this
          }, this.components[$type]));
          var componentNode = treeNode.instance.el;
          treeNode.renderedChildren = this.diffArray($parentNode, treeNode.placeHolder, treeNode.renderedChildren, componentNode ? this.nodeToArray(componentNode) : []);
        }

        return;
      }

      if ($type === "slot") {
        // Handle <slot> in component
        this.addPlaceHolder(treeNode, "slot");
        var childNodes = this.getChildNodes(this.props.children.cloneNode(true));
        new Colon({
          template: childNodes,
          recursive: true,
          root: this.root,
          parent: this,
          props: this.props,
          data: this.data,
          methods: this.methods,
          directives: this.directives,
          components: this.components,
          loopScope: this.loopScope
        });
        treeNode.renderedChildren = this.diffArray($parentNode, treeNode.placeHolder, treeNode.renderedChildren, childNodes);
        return;
      } // Cycle through all the attributes that start with : or @


      Object.entries($attrs).filter(function (_ref8) {
        var k = _ref8[0];
        return /^[:@]/.test(k);
      }).forEach(function (_ref9) {
        var $attr = _ref9[0],
            $value = _ref9[1];
        // If node has :for or :if, do not process anything other than :for or :if
        if (_this3.attrExist($attrs, [":for", ":if"]) && !/^:(for|if)$/.test($attr)) return; // Remove the : or @ from the attribute name

        var attr = $attr.slice(1); // Remove the attribute with : or @ from DOM since it is unnecessary

        if ($this && typeof $this.getAttribute($attr) !== "undefined") $this.removeAttribute($attr);

        if (/^@/.test($attr)) {
          // If the attribute starts with @, add it as an event listener
          if (treeNode.events.indexOf(attr) >= 0) return;
          $this.addEventListener(attr, function () {
            for (var _len = arguments.length, $arguments = new Array(_len), _key = 0; _key < _len; _key++) {
              $arguments[_key] = arguments[_key];
            }

            _this3.run($value, {
              $multi: true,
              $arguments: $arguments,
              $event: $arguments[0],
              $this: $this
            });

            _this3.render();
          }, false);
          treeNode.events.push(attr);
        } else if ($attr === ":for") {
          // Handle :for
          var _$value$match$slice = $value.match(/^\s*([^\s,]+)(?:\s*,\s*([^\s,]+))?\s+in\s+(.+)/).slice(1),
              valVar = _$value$match$slice[0],
              keyVar = _$value$match$slice[1],
              list = _$value$match$slice[2];

          _this3.addPlaceHolder(treeNode, ":for");

          list = _this3.run(list, {
            $this: $this
          }) || [];
          if (Array.isArray(list)) list = list.map(function (v, k) {
            return [k, v];
          });
          if (_this3.isObject(list)) list = Object.entries(list);
          list = list.reduce(function (acc, _ref10, i, arr) {
            var keyValue = _ref10[0];
            // Create a new Colon instance for each row of the list and render
            var newNodeClone = treeNode.cloneNode.cloneNode(true);
            new Colon({
              el: newNodeClone,
              recursive: true,
              root: _this3.root,
              parent: _this3.parent,
              props: _this3.props,
              data: _this3.data,
              methods: _this3.methods,
              directives: _this3.directives,
              components: _this3.components,
              loopScope: [].concat(_this3.loopScope, [{
                arr: arr,
                keyVar: keyVar,
                keyValue: keyValue,
                valVar: valVar
              }])
            });
            acc.push.apply(acc, _this3.nodeToArray(newNodeClone));
            return acc;
          }, []);
          treeNode.renderedChildren = _this3.diffArray($parentNode, treeNode.placeHolder, treeNode.renderedChildren, list);
        } else if ($attr === ":if") {
          // Handle :if
          _this3.addPlaceHolder(treeNode, ":if");

          var newNodeClone;

          if (_this3.run($value, {
            $this: $this
          })) {
            newNodeClone = treeNode.cloneNode.cloneNode(true);
            new Colon({
              el: newNodeClone,
              recursive: true,
              root: _this3.root,
              parent: _this3.parent,
              props: _this3.props,
              data: _this3.data,
              methods: _this3.methods,
              directives: _this3.directives,
              components: _this3.components,
              loopScope: _this3.loopScope
            });
          }

          treeNode.renderedChildren = _this3.diffArray($parentNode, treeNode.placeHolder, treeNode.renderedChildren, newNodeClone ? _this3.nodeToArray(newNodeClone) : []);
        } else if (/^:(class|style)$/.test($attr)) {
          // Handle :class and :style
          var isClass = attr === "class";
          var newValue = _this3.run($value, {
            $this: $this
          }) || "";
          if (Array.isArray(newValue)) newValue = newValue.join(isClass ? " " : ";");
          if (_this3.isObject(newValue)) newValue = Object.entries(newValue).reduce(function (acc, _ref11) {
            var k = _ref11[0],
                v = _ref11[1];
            return acc + " " + (isClass ? v ? k : '' : k + ":" + v + ";");
          }, "");
          var styleString = ("" + ($attrs[attr] || '') + (isClass ? " " : ";") + (newValue || '')).trim();

          _this3.diffAttr($this, attr, null, styleString);
        } else if ($attr === ":show") {
          // Handle :show
          var _newValue = _this3.run($value, {
            $this: $this
          });

          $this[_newValue ? 'removeAttribute' : 'setAttribute']('__CJSHIDE', _newValue);
        } else if (/^:(html|text|json)$/.test($attr)) {
          // Handle :html, :text, :json
          if (!$this) return;

          var _newValue2 = _this3.run($value, {
            $this: $this
          });

          if (attr === "json") _newValue2 = JSON.stringify(_newValue2, null, 2);
          if (_newValue2 === null || typeof _newValue2 === 'undefined') _newValue2 = "";
          var prop = attr === "html" ? "innerHTML" : "innerText";
          if ($this[prop] !== _newValue2) $this[prop] = _newValue2;
        } else if ($attr) {
          // Run all the matching directives for the attribute
          if (Object.entries(_this3.directives).filter(function (_ref12) {
            var k = _ref12[0],
                v = _ref12[1];

            if (new RegExp(k).test($attr)) {
              v({
                $app: $app,
                $attr: $attr,
                $value: $value,
                $this: $this,
                $parentNode: $parentNode
              });
              return true;
            }
          }).length) return; // If there are no directives, run the code and set it as an attribute.

          var _newValue3 = _this3.run($value, {
            $this: $this
          }); //if(/^:/.test(attr)) attr = attr.slice(1);


          _this3.diffAttr($this, attr, null, _newValue3);
        }
      }); // If node does not have :for or :if, process all its non string children

      if (!this.attrExist($attrs, [":for", ":if"])) $children.filter(function (v) {
        return typeof v !== "string";
      }).forEach(this.renderTreeNode.bind(this));
    } // Render template tree.
    ;

    _proto.render = function render(fn) {
      // Run fn function if provided
      if (fn) {
        fn.bind(this)(this);
      } // Call lifecycle event 'beforeUpdate'


      this.beforeUpdate(); // Initiate render for template tree.

      this.renderTreeNode(this.templateTree); // Call lifecycle event 'updated'

      this.updated();
    };

    return Colon;
  }();

  return Colon;

})));
