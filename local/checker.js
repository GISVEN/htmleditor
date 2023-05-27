export class Checker {
    require_types = ['remove'];
    parser = new DOMParser();
    constructor(requires=[]) {
        this._requires = requires;
    }

    checkIt(htmlValue) {
        // console.log('check?');
        this._requires.forEach(req => {
            // console.log('req', req);
            switch (req.task) {
                case 'remove':
                    this.checkRemove(htmlValue, req.value);
                    break;
                case 'add':
                    this.checkAdd(htmlValue, req.value);
                    break;
                case "child":
                    this.checkChild(htmlValue, req.parent, req.child);
                    break;
            }
        })
    }

    checkChildHelp(check, parent, child) {
        let result = false;
        for (let v = 0; v < check.length; v++) {
            if (check[v].children) result = this.checkChild((check[v].child), parent, child);
            if (check[v].isEqual(parent) && check[v].children.isEqual(child)) result = true;
        }
        return result;
    }
    checkChild(htmlValue, parent, child) {
        let htmlValue_parsed = this.parse(htmlValue);
        let parent_parsed = this.freeFromBody(this.parse(parent));
        let child_parsed = this.freeFromBody(this.parse(child));
        let result = this.checkChildHelp(htmlValue_parsed, parent_parsed, child_parsed);
        console.log("child?", result);
    }
    findElement(check, value) {
        let result = true;
        for (let v = 0; v < check.length; v++) {
            // console.log('value', value)
            // console.log('check', check[0])
            if (check[v].children) result = this.findElement((check[v].children), value)
            if (check[v].isEqualNode(value)) result = false;
        }
        return result;
    }
    parse(it) {
        return this.parser.parseFromString(it, 'text/html');
    }
    freeFromBody(it) {
        return it.children[0].children[1].children[0];
    }
    checkAdd(htmlValue, value) {
        let htmlValue_parsed = this.parse(htmlValue);
        let value_parsed = this.freeFromBody(this.parse(value));
        let result = this.findElement(htmlValue_parsed.children, value_parsed);
        console.log('created?', !result);
    }
    checkRemove(htmlValue, value) {
        let htmlValue_parsed = this.parse(htmlValue);
        let value_parsed = this.freeFromBody(this.parse(value));
        let result = this.findElement(htmlValue_parsed.children, value_parsed);
        console.log('deleted?', result);
    }
}