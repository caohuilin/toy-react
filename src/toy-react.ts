
export abstract class Component {
    props = Object.create(null)
    children = []
    _root: null

    abstract render()

    get root() {
        if (!this._root) {
            this._root = this.render().root
        }
        return this._root

    }

    setAttribute(key: string, value: any) {
        this.props[key] = value
    }
    appendChild(component: Component) {
        this.children.push(component)
    }
}

class FuncComponent extends Component {
    func: (attrs: {[key: string]: any}) => Component
    constructor(func: () => Component) {
        super()
        this.func = func
    }
    render() {
        return this.func({...this.props, children: this.children})
    }
}

class ElementWrapper {
    root: HTMLElement
    constructor(type: string) {
        this.root = document.createElement(type)
    }
    setAttribute(key: string, value: any) {
        this.root.setAttribute(key, value)
    }
    appendChild(component: Component) {
        this.root.appendChild(component.root)
    }
}
class TextWrapper {
    root: Text
    constructor(content: string) {
        this.root = document.createTextNode(content)
    }
}

export function createElement(type: (new () => Component) | (() => Component) | string, attrs: { [key: string]: any }, ...children) {
    let element
    if (typeof type === 'string') {
        element = new ElementWrapper(type)
    } else if (type.prototype instanceof Component) {
        element = new (type as new () => Component)
    } else {
        element = new FuncComponent(type as (() => Component))
    }
    for (let attr in attrs) {
        element.setAttribute(attr, attrs[attr])
    }
    const insertChild = (children) => {
        for (let child of children) {
            if (typeof child === 'string') {
                child = new TextWrapper(child)
            }
            if (Array.isArray(child)) {
                insertChild(child)
            } else {
                element.appendChild(child)
            }
        }
    }
    insertChild(children)
    return element
}
export function render(component: Component, parent: HTMLElement) {
    parent.appendChild(component.root)
}