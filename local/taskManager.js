let requires_types = ['attribute', 'child', 'content'];

class myRequire {
    constructor(args) {
        this._type = args.type || '';
        this._name = args.name || '';
        this._value = args.value || '';
        this._child = args.child || '';

    }


}
class mySubject {
    constructor(name) {
        this._requires = [];
        this._name = name;
    }
    requireAttribute(name, value) {
        this._requires.push(new myRequire({
                type:'attribute',
                name:name,
                value:value
        }))
        return this;
    }
    requireChild(subject) {
        this._requires.push(new myRequire(
            {type:'child', child:subject}
        ))
        return this;
    }
    requireContent(content='') {
        this._requires.push(new myRequire(
            {type:'content', value:content}
        ))
    }
    createDom() {
        this._dom = document.createElement(this._name);
        this._requires.forEach(req => {
            console.log(req);
            switch (req._type) {
                case 'attribute':
                    this._dom.setAttribute(req._name, req._value);
                    break;
                case 'child':
                    if (!req._child._dom) req._child.createDom();
                    this._dom.appendChild(req._child._dom);
                    break;
                case 'content':
                    this._dom.innerHTML += req._value;
            }
        })
        return this._dom;
    }
}

class Instruction {
    constructor(name) {
        this._name = name;
        this._subjects = [];
    }
    newSubject(name='') {
        let subject = new mySubject(name);
        this._subjects.push(subject);
        return subject
    }
    selectSubject(subject) {
        this._subjects.push(subject)
        return subject
    }
    assembleInstruction() {
        this._subjects.forEach(subject => {
            if (!subject._dom) subject.createDom();
        })
    }
}

export class CustomTask {
    _start;
    _instructions;
    _final = '<div class="cl"><p><a id="a">hello world</a></p></div>'
    constructor(start) {
        this._instructions = [];
        this._start = new mySubject(start);
    }
    addInstruction(instruction) {
        this._instructions.push(instruction);
    }
    assembleFinal() {
        this._instructions.forEach(instruction => {
            instruction.assembleInstruction();
        })
        return this._start._dom;
    }
    newInstruction(name) {
        let instruction = new Instruction(name)
        this._instructions.push(instruction)
        return instruction;
    }
}
