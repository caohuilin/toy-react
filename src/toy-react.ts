
const RENDER_TO_DOM = Symbol('render_to_dom')

declare global {
    namespace JSX {
        interface IntrinsicElements extends Component<any, any> {
            button: any
            div: any
            span: any
            ol: any
            li: any

        }
    }
}

export abstract class Component<P = any, S = {}> {
    props: P = Object.create(null)
    children: (Component | ElementWrapper | TextWrapper)[] = []
    vChildren: Component[] = []
    type: string = ''
    content: string = ''
    _root: null = null
    _range: Range | null = null
    _vdom: Component | null = null
    state: S = {} as S

    abstract render(): Component

    get vDom(): Component {
        return this.render().vDom
    }

    setAttribute(key: string, value: any) {
        const props = this.props as { [key: string]: any }
        props[key] = value
    }
    appendChild(component: Component | ElementWrapper | TextWrapper) {
        this.children.push(component)
    }

    [RENDER_TO_DOM](range: Range) {
        this._range = range
        this._vdom = this.vDom
        this._vdom[RENDER_TO_DOM](range)
    }

    update() {
        // 判断两个节点本身是否相等
        const isSameNode = (oldVDom: Component, newVDom: Component) => {
            if (oldVDom.type !== newVDom.type) {
                return false
            }
            for(let key in newVDom.props) {
                if (newVDom.props[key] !== oldVDom.props[key]) {
                    return false
                }
            }
            if (Object.keys(oldVDom).length !== Object.keys(newVDom).length) {
                return false
            }
            if(newVDom.type === '#text' && newVDom.content !== oldVDom.content) {
                return false
            }
            return true
        }
        const update = (oldVDom: Component, newVDom: Component) => {
            if (!isSameNode(oldVDom, newVDom)) {
                newVDom[RENDER_TO_DOM](oldVDom._range!)
                return
            }
            newVDom._range = oldVDom._range
            const newChildren = newVDom.vChildren
            const oldChildren = oldVDom.vChildren
            let tailRange = oldChildren[oldChildren.length - 1]._range
            for(let i = 0; i < newChildren.length; i++) {
                const newChild = newChildren[i]
                if (i < oldChildren.length) {
                    const oldChild = oldChildren[i]
                    update(oldChild, newChild)
                } else {
                    const range = document.createRange()
                    range.setStart(tailRange!.endContainer, tailRange!.endOffset)
                    range.setEnd(tailRange!.endContainer, tailRange!.endOffset)
                    newChild[RENDER_TO_DOM](range)
                    tailRange = range
                }
            }
        }
        const vDom = this.vDom
        update(this._vdom!, vDom)
        this._vdom = vDom
    }

    setState(newState: Partial<S>) {
        this.state = Object.assign({}, this.state || {}, newState) as S
        this.update()
    }
}

type PropsWithChildren<P> = P & { children?: Component };

interface FunctionComponent<P = {}> {
    (props: PropsWithChildren<P>, context?: any): Element | null;
}

export type SFC<P = {}> = FunctionComponent<P>;

class FuncComponent extends Component {
    func: (attrs: { [key: string]: any }) => Component
    constructor(func: () => Component) {
        super()
        this.func = func
    }
    render() {
        return this.func({ ...this.props, children: this.children })
    }
}

function replaceContent(range:Range, node: Node) {
    range.insertNode(node)
    range.setStartAfter(node)
    range.deleteContents()

    range.setStartBefore(node)
    range.setEndAfter(node)
}

class ElementWrapper extends Component {
    constructor(type: string) {
        super()
        this.type = type
    }

    get vDom(): ElementWrapper {
        this.vChildren = this.children.map(child => child.vDom)
        return this
    }
    render() {
        return this
    }
    [RENDER_TO_DOM](range: Range) {
        this._range = range
        const root = document.createElement(this.type)
        for (const key in this.props) {
            const value = this.props[key]
            if (key === 'className') {
                root.setAttribute('class', value)
            } else if (key.match(/^on([\s\S]+)/)) {
                root.addEventListener(RegExp.$1.replace(/^[\s\S]/, c => c.toLowerCase()), value)
            } else {
                root.setAttribute(key, value)
            }
        }
        for (const child of this.vChildren) {
            const childRange = document.createRange()
            childRange.setStart(root, root.childNodes.length)
            childRange.setEnd(root, root.childNodes.length)
            childRange.deleteContents()
            child[RENDER_TO_DOM](childRange)
        }
        replaceContent(range, root)
    }
}
class TextWrapper extends Component {
    root: Text
    constructor(content: string) {
        super()
        this.type = '#text'
        this.content = content
        this.root = document.createTextNode(content)
    }
    get vDom(): TextWrapper {
        return this
    }
    render() {
        return this
    }
    [RENDER_TO_DOM](range: Range) {
        this._range = range
        const root = document.createTextNode(this.content)
        replaceContent(range, root)
    }
}

export function createElement(type: (new () => Component) | (() => Component) | string, attrs: { [key: string]: any }, ...children: (Component | string | number | null)[]) {
    let element: Component | ElementWrapper
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
    const insertChild = (children: (Component | TextWrapper | string | number | null)[]) => {
        for (let child of children) {
            if (child === null) {
                continue
            }
            if (typeof child === 'string' || typeof child === 'number') {
                child = new TextWrapper(child.toString())
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
    const range = document.createRange()
    range.setStart(parent, 0)
    range.setEnd(parent, parent.childNodes.length)
    range.deleteContents()
    component[RENDER_TO_DOM](range)
}