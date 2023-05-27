let activity_button;
let appended = false;

function openModal() {
    let myModal = document.getElementById("myModal")
    myModal.style.display = "block";
    if (!appended) {
        console.log(activity_button);
        document.querySelector('.modal-content').appendChild(activity_button)
        appended = true;
    };
}
  
  function closeModal() {
    document.getElementById("myModal").style.display = "none";
}
  


function getDescription(rule, is_valid) {
        
    console.log('rule in ds', rule.rule.rule_text);
    let name = rule?.name ?? rule?.rule.rule_text ?? 'rule text';
    let description = rule?.description ?? 'rule description';
    // let style = is_valid ? 'style="background: #d3f2e0"' : '';
    let style = is_valid ? "background: #d3f2e0" : '';

    let h3 = document.createElement('h3');
    h3.textContent += name;
    let p = document.createElement('p');
    p.textContent += description;
    let out = document.createElement('div')
    out.appendChild(h3);
    out.appendChild(p);
    out.setAttribute('style', style);
    let temp = document.createElement('div');
    temp.appendChild(out);

    return temp.innerHTML;

    // return `<div ${style}><h3>\\${name}</h3><p>${description}</p><br></div>`;

}

function unpackFromBody(dom, index = 0) {
    if (dom.nodeName === 'BODY') {
        // console.log('dom name is', dom.nodeName);
        return dom.childNodes[index];
    }
    if (dom.querySelector('body') == null) {
        // console.warn('unpack error! cant find body in', dom);
        return dom;
    }
    return dom.querySelector('body').childNodes[index];
}

function prepareToQuerySelector(rule_dom) {
    let result = '';
    //console.log('rule_dom', rule_dom);
    let attributes = rule_dom.attributes;
    //console.log('attributes', attributes);
    result += rule_dom.nodeName;
    //console.log('node name', rule_dom.nodeName);
    if (attributes != undefined) {
        for (let attribute of attributes) {
            result += `[${attribute.name}="${attribute.value}"]`
        }  
    }

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

        // console.log('from dom', dom_for_from);
        preparedString = prepareToQuerySelector(dom_for_from);
        // console.log('prepared string:', preparedString);

        check_from_here = htmlValue_dom.querySelector(preparedString);
        check_from_here = unpackFromBody(check_from_here);
    
    }

    if (check_from_here == null && from !== 'body') {
        //console.warn('check point is missing! going check from body!');
        check_from_here = htmlValue_dom.querySelector('body');
    }

    let rule_dom = parser.parseFromString(rule_object.rule.rule_text, 'text/html');
    rule_dom = unpackFromBody(rule_dom);

    return [check_from_here, rule_dom];
}

function check(htmlValue, rule_object, check_type, from = 'body') {
    let valid = true;
    let valid_check_types = ['exist', 'delete'];
    // console.warn('check from value', from);

    let [check_from_here, rule_dom] = prepareToCheck(htmlValue, rule_object, from);
    // console.log(check_from_here, rule_dom);

    if (!(valid_check_types.includes(check_type))) 
    {
        console.warn('Invalid check type', check_type,' This rule will be skipped!');
        return true;
    }

    //console.log('check', check_type, 'for', rule_object, 'from', check_from_here);

    let finded = false;
    check_from_here.childNodes.forEach(child => {
        //console.warn('compare',child,'and',rule_dom);

        if (rule_dom.nodeName !== "#text" || child.nodeName !== '#text') {
            //console.warn(child.isEqualNode(rule_dom) ? 'equale!' : 'fail!');
            finded ||= child.isEqualNode(rule_dom);
        } else {
                
            let rule_text = rule_dom.nodeValue.trim();
            let child_text = child.nodeValue.trim();
            //console.warn(child_text == rule_text ? 'equale!' : 'fail!');
            finded ||= child_text == rule_text;
        }
         
    });

    valid &= check_type === 'exist' ? finded : !finded;

    //console.warn('check complete! result', Boolean(valid));

    return valid;
}


function validRule(htmlValue, rule_object, from = 'body') {
    
    let valid = true;

    if (rule_object.childs == null) {
        valid &= check(htmlValue, rule_object, rule_object.rule.rule_type, from);
        //console.warn('valid', Boolean(valid));
        return valid;
    }

    rule_object.childs.forEach(child => {
        if (rule_object.rule.rule_type == 'delete' && child.rule.rule_type == 'exist') valid &= true;
        else valid &= validRule(htmlValue, child , rule_object);
        //console.warn('valid', Boolean(valid));
        
    });
    return valid;
}


function analyze(htmlValue, cssValue, rules_unparsed, description) {
    let rules = [];
    
    try {rules = JSON.parse(rules_unparsed);} 
    catch (e) {
        //console.error(e, 'rules:', rules_unparsed);
        
    }
    //console.warn(rules);

    let description_text = '';
    let all_valid = true;

    rules.forEach(rule => {
        // console.log('rule', rule);
        let is_valid = validRule(htmlValue, rule);
        //console.warn('rule is valid', Boolean(is_valid));
        all_valid &= is_valid;
        description_text += getDescription(rule, is_valid)
    })

    description.src = "data:text/html," + encodeURIComponent(description_text);
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
                        height: 95%;
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
                        grid-template-rows: 60% 40%;
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
            if (result) openModal();
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

define("init", function() {
    customElements.define('ace-playground', AcePlayground);
    // console.log("ace-playground defined!");
}
)




