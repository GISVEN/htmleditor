'use strict';

let activity_button;
let appended = false;
const DEBUG = false;

function dbm(values, type) {
    if (!DEBUG) return;

    switch (type) {
    case 'err':
        console.error(...values);
        break;
    case 'warn':
        console.warn(...values);
        break;
    default:
        console.log(...values);
        break;
    }
}

function openModal() {
    let myModal = document.getElementById("myModal")
    myModal.style.display = "block";

    if (!appended) {
        // console.log(activity_button);
        document.querySelector('.modal-content').appendChild(activity_button)
        appended = true;
    };
}
  
function closeModal() {
    document.getElementById("myModal").style.display = "none";
}
  
function getDescription(rule_object, is_valid) {
        
    let rule = rule_object.rule.rule;
    let name = rule?.name ?? 'rule name';
    let description = rule?.description ?? 'rule description';
    let style = is_valid ? "background: #d3f2e0; padding: 5px" : 'padding: 5px';
    let element_style = 'margin-top: 0';

    let h3 = document.createElement('h3');
    h3.textContent += name;
    h3.setAttribute('style', element_style);

    let p = document.createElement('p');
    p.textContent += description;
    p.setAttribute('style', element_style);

    let out = document.createElement('div')
    out.appendChild(h3);
    out.appendChild(p);
    out.setAttribute('style', style);

    let temp = document.createElement('div');
    temp.appendChild(out);

    return temp.innerHTML;
}

function unpackFromBody(dom, index = 0) {
    if (dom.nodeName === 'BODY') {
        dbm(['dom name is', dom.nodeName])
        return dom.childNodes[index];
    }
    if (dom.querySelector('body') == null) {
        dbm(['unpack error! cant find body in', dom], 'warn');
        return dom;
    }
    return dom.querySelector('body').childNodes[index];
}

function isDomElement(obj) {
    try {
      //Using W3 DOM2 (works for FF, Opera and Chrome)
      return obj instanceof HTMLElement;
    }
    catch(e){
      //Browsers not supporting W3 DOM2 don't have HTMLElement and
      //an exception is thrown and we end up here. Testing some
      //properties that all elements have (works on IE7)
      return (typeof obj==="object") &&
        (obj.nodeType===1) && (typeof obj.style === "object") &&
        (typeof obj.ownerDocument ==="object");
    }
  }

function prepareToQuerySelector(rule_dom) {
    if (!isDomElement(rule_dom) && rule_dom.nodeType === null) {
        dbm(["rule dom is not a DOM", rule_dom], 'err');
        return '';
    }
    let result = '';
    let attributes = rule_dom.attributes;
    // dbm(['attributes', attributes]);
    result += rule_dom.nodeName;
    
   dbm(['node', rule_dom]);

    if (rule_dom.nodeName === '#text') {
        return result += '-' + rule_dom.nodeValue.trim().replace(/\n/g, '');;
    }

    if (attributes == undefined) 
        return result;

    for (let attribute of attributes) 
        result += `[${attribute.name}="${attribute.value}"]`

    return result;
}




function prepareToCheck(htmlValue, rule_object, from = 'body') {
    let parser = new DOMParser();
    let htmlValue_dom = parser.parseFromString(htmlValue, 'text/html');

    let check_from_here;
    let dom_for_from;
    let preparedString;
    
    if (from === 'body') check_from_here = htmlValue_dom.querySelector('body');
    else {
        dom_for_from = parser.parseFromString(from.rule.rule_text, 'text/html');
        dom_for_from = unpackFromBody(dom_for_from);

        dbm(['from dom', dom_for_from])
        preparedString = prepareToQuerySelector(dom_for_from);
        dbm(['prepared string:', preparedString])

        check_from_here = htmlValue_dom.querySelector(preparedString);
        if (check_from_here !== null) check_from_here = unpackFromBody(check_from_here);
    
    }

    if (check_from_here == null && from !== 'body') {
        dbm(['check point is missing! going check from body!'], 'warn')
        check_from_here = htmlValue_dom.querySelector('body');
    }

    let rule_dom = parser.parseFromString(rule_object.rule.rule_text, 'text/html');
    rule_dom = unpackFromBody(rule_dom);

    return [check_from_here, rule_dom];
}

function check(htmlValue, rule_object, check_type, from = 'body') {
    let valid = true;
    let valid_check_types = ['exist', 'delete'];
    dbm(['check from value', from], 'warn');
    dbm(['rule_object', rule_object], 'warn');

    let [check_from_here, rule_dom] = prepareToCheck(htmlValue, rule_object, from);

    if (!(valid_check_types.includes(check_type))) 
    {
        dbm(['Invalid check type', check_type,' This rule will be skipped!'], 'warn');
        return true;
    }

    dbm(['check', check_type, 'for', rule_object, 'from', check_from_here])

    let finded = false;
    check_from_here.childNodes.forEach(child => {
        dbm(['compare',child,'and',rule_dom], 'warn');

        if (rule_dom.nodeName !== "#text" || child.nodeName !== '#text') {
            dbm([child.isEqualNode(rule_dom) ? 'equale!' : 'fail!'], 'warn');
            finded ||= child.isEqualNode(rule_dom);
        } else {
                
            let rule_text = rule_dom.nodeValue.trim();
            let child_text = child.nodeValue.trim();
            dbm([child_text == rule_text ? 'equale!' : 'fail!'], 'warn');
            finded ||= child_text == rule_text;
        }
         
    });

    valid &= check_type === 'exist' ? finded : !finded;

    dbm(['check complete! result', Boolean(valid)], 'warn');

    return valid;
}


function isIterable(obj) {
    // checks for null and undefined
    if (obj == null) {
      return false;
    }
    return typeof obj[Symbol.iterator] === 'function';
  }


// функция по преобразованию строки в dom
function stringToDom(string) {
    let parser = new DOMParser();
    return parser.parseFromString(string, 'text/html');
}

// функция по поиску родителя для правила
function tryFindParent(htmlValue, parent) {

    if (htmlValue == null) {
        dbm(["Nowhere to look"], 'err');
        return false;
    }

    let htmlValue_dom = stringToDom(htmlValue);
    // dbm(['html dom', htmlValue_dom], 'warn');

    if (parent === null) return false;


    let parent_dom = stringToDom(parent.rule.rule_text);
    parent_dom = unpackFromBody(parent_dom);
    // dbm(['parent dom 1', parent_dom], 'warn');

    if (!parent_dom) {return false};

    let prepared_string = prepareToQuerySelector(parent_dom);
    // dbm(['prepared string', prepared_string], 'warn');

    let selected = htmlValue_dom.querySelector(prepared_string);
    // dbm(['selected', selected], 'warn');

    return selected ? selected : false;
}

function getDomWithChilds(rule_object) {
    let result = stringToDom(rule_object.rule.rule_text);
    result = unpackFromBody(result);
    let childs = [];

    if (isIterable(rule_object.rule.childs)) {
        rule_object.rule.childs.forEach(child => {
            childs.push(...getDomWithChilds(child));
        })
    }
    if (isIterable(childs)) {
        childs.forEach(child => {
            result.appendChild(child);
        })
    }

    return result;
}

// функция по поиску правила на parent dom
function tryFindRule(rule_object, parent_dom) {
    let valid = false;
    let check_exist = rule_object.rule.rule_type === 'exist';
    dbm(['trying find rule', rule_object.rule.rule_text, 'at', parent_dom], 'warn');

    let rule_dom = stringToDom(rule_object.rule?.rule_text);
    rule_dom = unpackFromBody(rule_dom);

    let rule_dom_string = prepareToQuerySelector(rule_dom);

    let parent_dom_childs = parent_dom.childNodes;
    // dbm(["parent dom childs", parent_dom_childs]);

    let finded= null;

    if (isIterable(parent_dom_childs)) {
        parent_dom_childs.forEach(child => {
            let child_dom = child;
            if (typeof child === 'string') {
                child_dom = document.createTextNode(child);
            }
            // dbm(['child dom', child_dom], 'warn');
            let child_string = prepareToQuerySelector(child_dom);
            dbm(['compare strings', rule_dom_string, 'and', child_string , rule_dom_string === child_string], 'warn')
            let find = rule_dom_string === child_string;
            valid |= check_exist ? find : !find;
            // dbm(['is valid', valid]);
            if (rule_dom_string === child_string) finded = child;

        })
    } 
    if (parent_dom_childs.length == 0) {
        dbm(['parent childs is empty!']);
        if (!check_exist) valid = true;
    }

    dbm(['rule is finded', valid], 'warn');

    dbm(['start finding childs for', rule_object]);
    let valid_childs = true;
    if (valid) {
        rule_object.childs?.forEach(rule_child => {
            valid_childs &= tryFindRule(rule_child, finded);
        });
    }
    dbm(['valid childs', valid_childs]);
    valid &= valid_childs;


    return valid;
}

// функция проверяет правило на валидность
function validRule(htmlValue, rule_object) {
    
    let valid = true;
    let htmlValue_dom = stringToDom(htmlValue);
    let body = htmlValue_dom.querySelector('body');
    let head = htmlValue_dom.querySelector('head');

    // новый обработчик
    let rule_type = rule_object.rule.rule.rule_type;
    dbm(['rule type', rule_type], 'err');

    if (rule_object.parent !== null) {
        let parent_dom = tryFindParent(htmlValue, rule_object.parent);
        if (parent_dom === false) return false;
        
        dbm(['parent dom', parent_dom], 'warn');
        dbm(['parent string', prepareToQuerySelector(parent_dom)], 'warn');

        valid &= tryFindRule(rule_object.rule, parent_dom);


    } else {
        valid &= tryFindRule(rule_object.rule, body);
        dbm(['first valid', valid]);
        if (!valid) valid &= tryFindRule(rule_object.rule, head);
        dbm(['second valid', valid]);
        if (!valid) valid &= tryFindRule(rule_object.rule, htmlValue_dom);
        dbm(['fin valid', valid]);
    }
    // старый обработчик
    // if (rule_object.childs == null) {
    //     valid &= check(htmlValue, rule_object, rule_object.rule.rule_type, from);
    //     return valid;
    // }

    // rule_object.childs.forEach(child => {
    //     if (rule_object.rule.rule_type == 'delete' && child.rule.rule_type == 'exist') valid &= true;
    //     else valid &= validRule(htmlValue, child , rule_object);
        
    // });
    return valid;
}


// вспомогательная функция к prepareRules
function prepareRule(rule_object, parent = null) {
    let prepared_rules = [];

    // dbm(['preparing rule', rule_object], 'warn');

    prepared_rules.push({
        'parent': parent,
        'rule': rule_object
    });


    let rule_childs = rule_object.childs
    // dbm(['rule childs', rule_childs], 'warn');

    if (rule_childs == null) return prepared_rules;

    for (let i = 0; i < rule_childs.length; i++) {
        let child = rule_childs[i];

        // dbm(['child', child], 'warm');
        // dbm(['rule c', rule_childs], 'warn');
        // dbm(['index', i]);

        if (child.rule.root == 1)
            prepared_rules.push(...prepareRule(child, rule_object))

    }

    // dbm(['prepared rules', prepared_rules], 'warn');

    prepared_rules.forEach(rule => {
        // dbm(['rule to delete', rule.rule, 'from', rule_object.childs]);
        let index = rule_object.childs?.indexOf(rule.rule);
        if (index !== -1) rule_object.childs?.splice(index, 1);
    });
    

    return prepared_rules;
}   

// функция для разбивания правил по root атрибуту
function prepareRules(rules) {

    let prepared_rules = [];

    rules.forEach(rule_object => {
        prepared_rules.push(...prepareRule(rule_object));
    })

    return prepared_rules;    
}


function analyze(htmlValue, cssValue, rules_unparsed, description) {
    let rules = [];
    
    try {rules = JSON.parse(rules_unparsed);} 
    catch (e) {
        dbm([e, 'rule:', rules_unparsed], 'err');
    }

    let description_text = '';
    let all_valid = true;

    // новая обработка
    let prepared_rules = prepareRules(rules);
    dbm([prepared_rules]);

    prepared_rules.forEach(prepared_rule => {
        dbm(['analyze rule', prepared_rule]);
        let is_valid = validRule(htmlValue, prepared_rule);
        dbm(['rule is valid:', Boolean(is_valid)], 'warn');
        all_valid &= is_valid;
        description_text += getDescription(prepared_rule, is_valid);
    })

    // старая обработка
    // rules.forEach(rule => {
    //     dbm(['analyze rule', rule]);
    //     let is_valid = validRule(htmlValue, rule);
    //     dbm(['rule is valid:', Boolean(is_valid)], 'warn');
    //     all_valid &= is_valid;
    //     description_text += getDescription(rule, is_valid)
    // })

    description.src = "data:text/html;charset=UTF-8," + encodeURIComponent(description_text);
    return all_valid;
}

let updatePreviewTimeout = undefined;


class AcePlayground extends HTMLElement {
    rules = null;

    constructor() {
        super();

        let html = this.getAttribute('html');
        let css = this.getAttribute('css');

        // если истина, элемент не будет содержать вывод и задания
        let editor_only = this.hasAttribute("editor_only");
        let description_text = this.getAttribute('description');
        this.rules = this.getAttribute('rules');


        let shadow = this.attachShadow({mode: "open"});
        let dom = require("ace/lib/dom");

        if (editor_only) 
            dom.buildDom(
                ["div", {id: "host"},
                    ["div", {id: "redactors"},
                        ["div", {id: "tabs_panel"},
                            ["button", {id: "html_tab" ,class: "tab_links"}],
                            ["button", {id: "css_tab", class: "tab_links" }]
                        ],
                        ["div", {id: "redactor" },
                            ["div", {id: "html", class: "tab_content"}],
                            ["div", {id: "css", class: "tab_content" }]
                        ],
                    ],
                    ["style", `
                        #html {
                            width: 100%;
                            height: 100%;
                        }
                        #css {
                            width: 100%;
                            height: 100%;
                            display: none;
                        }`
                    ]
                ], 
                shadow
            );
        else {
            dom.buildDom(
                ["div", {id: "host"},
                    ["div", {id: "redactors"}, 
                        ["div", {id: "tabs_panel"}, 
                            ["button", {id: "html_tab" ,class: "tab_links"}], 
                            ["button", {id: "css_tab", class: "tab_links" }]
                        ], 
                        ["div", {id: "redactor" },
                            ["div", {id: "html", class: "tab_content"}],
                            ["div", {id: "css", class: "tab_content" }]
                        ],
                    ],
                    ["div", {id: "info"},
                        ["iframe", {id: "preview"}],
                        ["iframe", {id: "description"}]
                    ],
                ["style", `
                    #host {
                        height: 150%;
                        display: grid;
                        grid-template-areas: "redactors info";
                        grid-template-columns: 50% 50%;
                    }
                    #redactors {
                        width: 100%;
                        height: 100%;
                    }
                    #info {
                        display: grid;
                        grid-template-areas: "preview" "description";
                        grid-template-rows: 65% 35%;
                        width: 100%;
                    }
                    #preview {
                        width: 100%;
                        height: 100%;
                    }
                    #description {
                        height: 100%;
                        width: 100%;
                    }
                    #html {
                        width: 100%;
                        height: 100%;
                    }
                    #css {
                        width: 100%;
                        height: 100%;
                        display: none;
                    }
                `]
            ], 
            shadow
            ); 
        }
        
    

        let tabs = ["html", "css"];

        tabs.forEach(v => {
            let selector = `#${v}_tab`;
            let tab_button = shadow.querySelector(selector);

            tab_button.setAttribute("name", v);
            tab_button.innerHTML = v;
            tab_button.onclick = (e) => {openTab(e, v, shadow)};

        });

        let htmlEditor = ace.edit(shadow.querySelector("#html"), {
            theme: "ace/theme/github",
            mode: "ace/mode/html",
            value: html || "<p>if u see this, something wrong</p>",
            autoScrollEditorIntoView: true
        });
        let cssEditor = ace.edit(shadow.querySelector("#css"), {
            theme: "ace/theme/github",
            mode: "ace/mode/css",
            value: css || "*{color:red}",
            autoScrollEditorIntoView: true
        });

        this.htmlEditor = htmlEditor;
        this.cssEditor = cssEditor;


        if (!editor_only) {
            let description = shadow.querySelector("#description");
            let preview = shadow.querySelector("#preview");
            this.desctiotion = description;
            this.preview = preview;
        }

        htmlEditor.renderer.attachToShadowRoot();


        function updateAndCheck() {
            let code = this.htmlEditor.getValue() + "<style>" + this.cssEditor.getValue() + "</style>";
            this.preview.src = "data:text/html," + encodeURIComponent(code);

            let result = analyze(this.htmlEditor.getValue(), this.cssEditor.getValue(), this.rules, this.desctiotion);
            if (result) {
                let url = window.location.href;
                fetch(url, {
                    method: 'POST',
                    body: JSON.stringify({'complete': 'complete'}),
                    headers: {
                        'Content-Type': 'application/json'
                    }
                }).then(
                    response => {
                        console.log(response.body);
                        openModal();
                    }
                )
                // openModal();
            }
            // TODO css code check!


        }

        if (!editor_only) {
            updateAndCheck = updateAndCheck.bind(this);
            this.updatePreviewTimeoutUpdate = function(time)
            {
                if (updatePreviewTimeout !== undefined)
                {
                    clearTimeout(updatePreviewTimeout);
                    updatePreviewTimeout = undefined;
                }
                updatePreviewTimeout = setTimeout(updateAndCheck, time > 0 ? time : 1000);
            }
    
            htmlEditor.on("input", this.updatePreviewTimeoutUpdate);
            cssEditor.on("input", this.updatePreviewTimeoutUpdate);


        }

        
        // this.updatePreviewTimeoutUpdate(1);

        this.desctiotion.src = "data:text/html," + encodeURIComponent(description_text);

        try {
            activity_button = document.querySelector('.btn.btn-outline-secondary.btn-sm.text-nowrap').cloneNode(true);
        } catch (e) {
            activity_button = document.querySelector('.btn.btn-success.btn-sm.text-nowrap').cloneNode(true)
        }
        document.querySelector('.activity-header').remove();

        function openTab(evt, tabName, shadowRoot)
        {
            let i, tab_content, tab_links;
            tab_content = shadowRoot.querySelectorAll(".tab_content");
            for (i = 0; i < tab_content.length; i++) {
                tab_content[i].style.display = "none";
            }
            tab_links = shadowRoot.querySelectorAll(".tab_links");
            for (i = 0; i < tab_links.length; i++) {
                tab_links[i].className = tab_links[i].className.replace(" active", "");
            }
            shadowRoot.getElementById(tabName).style.display = "block";
            evt.currentTarget.className += " active";
        }
    }
};

define(
    "init", 
    function() {
        customElements.define('ace-playground', AcePlayground);
        // console.log("ace-playground defined!");
    }
)




