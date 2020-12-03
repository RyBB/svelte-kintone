
(function(l, r) { if (l.getElementById('livereloadscript')) return; r = l.createElement('script'); r.async = 1; r.src = '//' + (window.location.host || 'localhost').split(':')[0] + ':35729/livereload.js?snipver=1'; r.id = 'livereloadscript'; l.getElementsByTagName('head')[0].appendChild(r) })(window.document);
var app = (function () {
    'use strict';

    function noop() { }
    function is_promise(value) {
        return value && typeof value === 'object' && typeof value.then === 'function';
    }
    function add_location(element, file, line, column, char) {
        element.__svelte_meta = {
            loc: { file, line, column, char }
        };
    }
    function run(fn) {
        return fn();
    }
    function blank_object() {
        return Object.create(null);
    }
    function run_all(fns) {
        fns.forEach(run);
    }
    function is_function(thing) {
        return typeof thing === 'function';
    }
    function safe_not_equal(a, b) {
        return a != a ? b == b : a !== b || ((a && typeof a === 'object') || typeof a === 'function');
    }
    function is_empty(obj) {
        return Object.keys(obj).length === 0;
    }

    function append(target, node) {
        target.appendChild(node);
    }
    function insert(target, node, anchor) {
        target.insertBefore(node, anchor || null);
    }
    function detach(node) {
        node.parentNode.removeChild(node);
    }
    function destroy_each(iterations, detaching) {
        for (let i = 0; i < iterations.length; i += 1) {
            if (iterations[i])
                iterations[i].d(detaching);
        }
    }
    function element(name) {
        return document.createElement(name);
    }
    function text(data) {
        return document.createTextNode(data);
    }
    function space() {
        return text(' ');
    }
    function listen(node, event, handler, options) {
        node.addEventListener(event, handler, options);
        return () => node.removeEventListener(event, handler, options);
    }
    function attr(node, attribute, value) {
        if (value == null)
            node.removeAttribute(attribute);
        else if (node.getAttribute(attribute) !== value)
            node.setAttribute(attribute, value);
    }
    function children(element) {
        return Array.from(element.childNodes);
    }
    function custom_event(type, detail) {
        const e = document.createEvent('CustomEvent');
        e.initCustomEvent(type, false, false, detail);
        return e;
    }

    let current_component;
    function set_current_component(component) {
        current_component = component;
    }
    function get_current_component() {
        if (!current_component)
            throw new Error('Function called outside component initialization');
        return current_component;
    }

    const dirty_components = [];
    const binding_callbacks = [];
    const render_callbacks = [];
    const flush_callbacks = [];
    const resolved_promise = Promise.resolve();
    let update_scheduled = false;
    function schedule_update() {
        if (!update_scheduled) {
            update_scheduled = true;
            resolved_promise.then(flush);
        }
    }
    function add_render_callback(fn) {
        render_callbacks.push(fn);
    }
    let flushing = false;
    const seen_callbacks = new Set();
    function flush() {
        if (flushing)
            return;
        flushing = true;
        do {
            // first, call beforeUpdate functions
            // and update components
            for (let i = 0; i < dirty_components.length; i += 1) {
                const component = dirty_components[i];
                set_current_component(component);
                update(component.$$);
            }
            set_current_component(null);
            dirty_components.length = 0;
            while (binding_callbacks.length)
                binding_callbacks.pop()();
            // then, once components are updated, call
            // afterUpdate functions. This may cause
            // subsequent updates...
            for (let i = 0; i < render_callbacks.length; i += 1) {
                const callback = render_callbacks[i];
                if (!seen_callbacks.has(callback)) {
                    // ...so guard against infinite loops
                    seen_callbacks.add(callback);
                    callback();
                }
            }
            render_callbacks.length = 0;
        } while (dirty_components.length);
        while (flush_callbacks.length) {
            flush_callbacks.pop()();
        }
        update_scheduled = false;
        flushing = false;
        seen_callbacks.clear();
    }
    function update($$) {
        if ($$.fragment !== null) {
            $$.update();
            run_all($$.before_update);
            const dirty = $$.dirty;
            $$.dirty = [-1];
            $$.fragment && $$.fragment.p($$.ctx, dirty);
            $$.after_update.forEach(add_render_callback);
        }
    }
    const outroing = new Set();
    let outros;
    function group_outros() {
        outros = {
            r: 0,
            c: [],
            p: outros // parent group
        };
    }
    function check_outros() {
        if (!outros.r) {
            run_all(outros.c);
        }
        outros = outros.p;
    }
    function transition_in(block, local) {
        if (block && block.i) {
            outroing.delete(block);
            block.i(local);
        }
    }
    function transition_out(block, local, detach, callback) {
        if (block && block.o) {
            if (outroing.has(block))
                return;
            outroing.add(block);
            outros.c.push(() => {
                outroing.delete(block);
                if (callback) {
                    if (detach)
                        block.d(1);
                    callback();
                }
            });
            block.o(local);
        }
    }

    function handle_promise(promise, info) {
        const token = info.token = {};
        function update(type, index, key, value) {
            if (info.token !== token)
                return;
            info.resolved = value;
            let child_ctx = info.ctx;
            if (key !== undefined) {
                child_ctx = child_ctx.slice();
                child_ctx[key] = value;
            }
            const block = type && (info.current = type)(child_ctx);
            let needs_flush = false;
            if (info.block) {
                if (info.blocks) {
                    info.blocks.forEach((block, i) => {
                        if (i !== index && block) {
                            group_outros();
                            transition_out(block, 1, 1, () => {
                                info.blocks[i] = null;
                            });
                            check_outros();
                        }
                    });
                }
                else {
                    info.block.d(1);
                }
                block.c();
                transition_in(block, 1);
                block.m(info.mount(), info.anchor);
                needs_flush = true;
            }
            info.block = block;
            if (info.blocks)
                info.blocks[index] = block;
            if (needs_flush) {
                flush();
            }
        }
        if (is_promise(promise)) {
            const current_component = get_current_component();
            promise.then(value => {
                set_current_component(current_component);
                update(info.then, 1, info.value, value);
                set_current_component(null);
            }, error => {
                set_current_component(current_component);
                update(info.catch, 2, info.error, error);
                set_current_component(null);
                if (!info.hasCatch) {
                    throw error;
                }
            });
            // if we previously had a then/catch block, destroy it
            if (info.current !== info.pending) {
                update(info.pending, 0);
                return true;
            }
        }
        else {
            if (info.current !== info.then) {
                update(info.then, 1, info.value, promise);
                return true;
            }
            info.resolved = promise;
        }
    }
    function mount_component(component, target, anchor) {
        const { fragment, on_mount, on_destroy, after_update } = component.$$;
        fragment && fragment.m(target, anchor);
        // onMount happens before the initial afterUpdate
        add_render_callback(() => {
            const new_on_destroy = on_mount.map(run).filter(is_function);
            if (on_destroy) {
                on_destroy.push(...new_on_destroy);
            }
            else {
                // Edge case - component was destroyed immediately,
                // most likely as a result of a binding initialising
                run_all(new_on_destroy);
            }
            component.$$.on_mount = [];
        });
        after_update.forEach(add_render_callback);
    }
    function destroy_component(component, detaching) {
        const $$ = component.$$;
        if ($$.fragment !== null) {
            run_all($$.on_destroy);
            $$.fragment && $$.fragment.d(detaching);
            // TODO null out other refs, including component.$$ (but need to
            // preserve final state?)
            $$.on_destroy = $$.fragment = null;
            $$.ctx = [];
        }
    }
    function make_dirty(component, i) {
        if (component.$$.dirty[0] === -1) {
            dirty_components.push(component);
            schedule_update();
            component.$$.dirty.fill(0);
        }
        component.$$.dirty[(i / 31) | 0] |= (1 << (i % 31));
    }
    function init(component, options, instance, create_fragment, not_equal, props, dirty = [-1]) {
        const parent_component = current_component;
        set_current_component(component);
        const prop_values = options.props || {};
        const $$ = component.$$ = {
            fragment: null,
            ctx: null,
            // state
            props,
            update: noop,
            not_equal,
            bound: blank_object(),
            // lifecycle
            on_mount: [],
            on_destroy: [],
            before_update: [],
            after_update: [],
            context: new Map(parent_component ? parent_component.$$.context : []),
            // everything else
            callbacks: blank_object(),
            dirty,
            skip_bound: false
        };
        let ready = false;
        $$.ctx = instance
            ? instance(component, prop_values, (i, ret, ...rest) => {
                const value = rest.length ? rest[0] : ret;
                if ($$.ctx && not_equal($$.ctx[i], $$.ctx[i] = value)) {
                    if (!$$.skip_bound && $$.bound[i])
                        $$.bound[i](value);
                    if (ready)
                        make_dirty(component, i);
                }
                return ret;
            })
            : [];
        $$.update();
        ready = true;
        run_all($$.before_update);
        // `false` as a special case of no DOM component
        $$.fragment = create_fragment ? create_fragment($$.ctx) : false;
        if (options.target) {
            if (options.hydrate) {
                const nodes = children(options.target);
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.l(nodes);
                nodes.forEach(detach);
            }
            else {
                // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                $$.fragment && $$.fragment.c();
            }
            if (options.intro)
                transition_in(component.$$.fragment);
            mount_component(component, options.target, options.anchor);
            flush();
        }
        set_current_component(parent_component);
    }
    /**
     * Base class for Svelte components. Used when dev=false.
     */
    class SvelteComponent {
        $destroy() {
            destroy_component(this, 1);
            this.$destroy = noop;
        }
        $on(type, callback) {
            const callbacks = (this.$$.callbacks[type] || (this.$$.callbacks[type] = []));
            callbacks.push(callback);
            return () => {
                const index = callbacks.indexOf(callback);
                if (index !== -1)
                    callbacks.splice(index, 1);
            };
        }
        $set($$props) {
            if (this.$$set && !is_empty($$props)) {
                this.$$.skip_bound = true;
                this.$$set($$props);
                this.$$.skip_bound = false;
            }
        }
    }

    function dispatch_dev(type, detail) {
        document.dispatchEvent(custom_event(type, Object.assign({ version: '3.31.0' }, detail)));
    }
    function append_dev(target, node) {
        dispatch_dev('SvelteDOMInsert', { target, node });
        append(target, node);
    }
    function insert_dev(target, node, anchor) {
        dispatch_dev('SvelteDOMInsert', { target, node, anchor });
        insert(target, node, anchor);
    }
    function detach_dev(node) {
        dispatch_dev('SvelteDOMRemove', { node });
        detach(node);
    }
    function listen_dev(node, event, handler, options, has_prevent_default, has_stop_propagation) {
        const modifiers = options === true ? ['capture'] : options ? Array.from(Object.keys(options)) : [];
        if (has_prevent_default)
            modifiers.push('preventDefault');
        if (has_stop_propagation)
            modifiers.push('stopPropagation');
        dispatch_dev('SvelteDOMAddEventListener', { node, event, handler, modifiers });
        const dispose = listen(node, event, handler, options);
        return () => {
            dispatch_dev('SvelteDOMRemoveEventListener', { node, event, handler, modifiers });
            dispose();
        };
    }
    function attr_dev(node, attribute, value) {
        attr(node, attribute, value);
        if (value == null)
            dispatch_dev('SvelteDOMRemoveAttribute', { node, attribute });
        else
            dispatch_dev('SvelteDOMSetAttribute', { node, attribute, value });
    }
    function set_data_dev(text, data) {
        data = '' + data;
        if (text.wholeText === data)
            return;
        dispatch_dev('SvelteDOMSetData', { node: text, data });
        text.data = data;
    }
    function validate_each_argument(arg) {
        if (typeof arg !== 'string' && !(arg && typeof arg === 'object' && 'length' in arg)) {
            let msg = '{#each} only iterates over array-like objects.';
            if (typeof Symbol === 'function' && arg && Symbol.iterator in arg) {
                msg += ' You can use a spread to convert this iterable into an array.';
            }
            throw new Error(msg);
        }
    }
    function validate_slots(name, slot, keys) {
        for (const slot_key of Object.keys(slot)) {
            if (!~keys.indexOf(slot_key)) {
                console.warn(`<${name}> received an unexpected slot "${slot_key}".`);
            }
        }
    }
    /**
     * Base class for Svelte components with some minor dev-enhancements. Used when dev=true.
     */
    class SvelteComponentDev extends SvelteComponent {
        constructor(options) {
            if (!options || (!options.target && !options.$$inline)) {
                throw new Error("'target' is a required option");
            }
            super();
        }
        $destroy() {
            super.$destroy();
            this.$destroy = () => {
                console.warn('Component was already destroyed'); // eslint-disable-line no-console
            };
        }
        $capture_state() { }
        $inject_state() { }
    }

    var records = [
      {
        "イベント名": {
          "type": "SINGLE_LINE_TEXT",
          "value": "DevRel/Asia"
        },
        "レコード番号": {
          "type": "RECORD_NUMBER",
          "value": "30"
        },
        "都道府県": {
          "type": "DROP_DOWN",
          "value": null
        },
        "メモ": {
          "type": "MULTI_LINE_TEXT",
          "value": ""
        },
        "開催場所_地域": {
          "type": "DROP_DOWN",
          "value": null
        },
        "$revision": {
          "type": "__REVISION__",
          "value": "1"
        },
        "更新日時": {
          "type": "UPDATED_TIME",
          "value": "2020-12-02T06:30:00Z"
        },
        "作成日時": {
          "type": "CREATED_TIME",
          "value": "2020-12-02T06:30:00Z"
        },
        "日付": {
          "type": "DATE",
          "value": "2020-11-14"
        },
        "$id": {
          "type": "__ID__",
          "value": "30"
        }
      },
      {
        "イベント名": {
          "type": "SINGLE_LINE_TEXT",
          "value": "kintone hack 本戦"
        },
        "レコード番号": {
          "type": "RECORD_NUMBER",
          "value": "29"
        },
        "都道府県": {
          "type": "DROP_DOWN",
          "value": "東京"
        },
        "メモ": {
          "type": "MULTI_LINE_TEXT",
          "value": ""
        },
        "開催場所_地域": {
          "type": "DROP_DOWN",
          "value": "南関東"
        },
        "$revision": {
          "type": "__REVISION__",
          "value": "1"
        },
        "更新日時": {
          "type": "UPDATED_TIME",
          "value": "2020-12-02T06:30:00Z"
        },
        "作成日時": {
          "type": "CREATED_TIME",
          "value": "2020-12-02T06:30:00Z"
        },
        "日付": {
          "type": "DATE",
          "value": "2020-11-11"
        },
        "$id": {
          "type": "__ID__",
          "value": "29"
        }
      },
      {
        "イベント名": {
          "type": "SINGLE_LINE_TEXT",
          "value": "謎解きはカスタマイズのあとで"
        },
        "レコード番号": {
          "type": "RECORD_NUMBER",
          "value": "28"
        },
        "都道府県": {
          "type": "DROP_DOWN",
          "value": "東京"
        },
        "メモ": {
          "type": "MULTI_LINE_TEXT",
          "value": ""
        },
        "開催場所_地域": {
          "type": "DROP_DOWN",
          "value": "南関東"
        },
        "$revision": {
          "type": "__REVISION__",
          "value": "1"
        },
        "更新日時": {
          "type": "UPDATED_TIME",
          "value": "2020-12-02T06:30:00Z"
        },
        "作成日時": {
          "type": "CREATED_TIME",
          "value": "2020-12-02T06:30:00Z"
        },
        "日付": {
          "type": "DATE",
          "value": "2020-11-11"
        },
        "$id": {
          "type": "__ID__",
          "value": "28"
        }
      },
      {
        "イベント名": {
          "type": "SINGLE_LINE_TEXT",
          "value": "がまんしないkintoneカスタマイズ"
        },
        "レコード番号": {
          "type": "RECORD_NUMBER",
          "value": "27"
        },
        "都道府県": {
          "type": "DROP_DOWN",
          "value": "東京"
        },
        "メモ": {
          "type": "MULTI_LINE_TEXT",
          "value": ""
        },
        "開催場所_地域": {
          "type": "DROP_DOWN",
          "value": "南関東"
        },
        "$revision": {
          "type": "__REVISION__",
          "value": "1"
        },
        "更新日時": {
          "type": "UPDATED_TIME",
          "value": "2020-12-02T06:29:00Z"
        },
        "作成日時": {
          "type": "CREATED_TIME",
          "value": "2020-12-02T06:29:00Z"
        },
        "日付": {
          "type": "DATE",
          "value": "2020-11-11"
        },
        "$id": {
          "type": "__ID__",
          "value": "27"
        }
      },
      {
        "イベント名": {
          "type": "SINGLE_LINE_TEXT",
          "value": "SCキャリアBAR"
        },
        "レコード番号": {
          "type": "RECORD_NUMBER",
          "value": "26"
        },
        "都道府県": {
          "type": "DROP_DOWN",
          "value": null
        },
        "メモ": {
          "type": "MULTI_LINE_TEXT",
          "value": ""
        },
        "開催場所_地域": {
          "type": "DROP_DOWN",
          "value": null
        },
        "$revision": {
          "type": "__REVISION__",
          "value": "1"
        },
        "更新日時": {
          "type": "UPDATED_TIME",
          "value": "2020-12-02T06:29:00Z"
        },
        "作成日時": {
          "type": "CREATED_TIME",
          "value": "2020-12-02T06:29:00Z"
        },
        "日付": {
          "type": "DATE",
          "value": "2020-05-20"
        },
        "$id": {
          "type": "__ID__",
          "value": "26"
        }
      },
      {
        "イベント名": {
          "type": "SINGLE_LINE_TEXT",
          "value": "新卒向けキャリアBAR"
        },
        "レコード番号": {
          "type": "RECORD_NUMBER",
          "value": "25"
        },
        "都道府県": {
          "type": "DROP_DOWN",
          "value": null
        },
        "メモ": {
          "type": "MULTI_LINE_TEXT",
          "value": ""
        },
        "開催場所_地域": {
          "type": "DROP_DOWN",
          "value": null
        },
        "$revision": {
          "type": "__REVISION__",
          "value": "1"
        },
        "更新日時": {
          "type": "UPDATED_TIME",
          "value": "2020-12-02T06:21:00Z"
        },
        "作成日時": {
          "type": "CREATED_TIME",
          "value": "2020-12-02T06:21:00Z"
        },
        "日付": {
          "type": "DATE",
          "value": "2020-06-11"
        },
        "$id": {
          "type": "__ID__",
          "value": "25"
        }
      },
      {
        "イベント名": {
          "type": "SINGLE_LINE_TEXT",
          "value": "Type就活 OBOGイベント"
        },
        "レコード番号": {
          "type": "RECORD_NUMBER",
          "value": "24"
        },
        "都道府県": {
          "type": "DROP_DOWN",
          "value": null
        },
        "メモ": {
          "type": "MULTI_LINE_TEXT",
          "value": ""
        },
        "開催場所_地域": {
          "type": "DROP_DOWN",
          "value": null
        },
        "$revision": {
          "type": "__REVISION__",
          "value": "1"
        },
        "更新日時": {
          "type": "UPDATED_TIME",
          "value": "2020-12-02T06:17:00Z"
        },
        "作成日時": {
          "type": "CREATED_TIME",
          "value": "2020-12-02T06:17:00Z"
        },
        "日付": {
          "type": "DATE",
          "value": "2020-10-17"
        },
        "$id": {
          "type": "__ID__",
          "value": "24"
        }
      },
      {
        "イベント名": {
          "type": "SINGLE_LINE_TEXT",
          "value": "Maker Faire Tokyo 2020"
        },
        "レコード番号": {
          "type": "RECORD_NUMBER",
          "value": "23"
        },
        "都道府県": {
          "type": "DROP_DOWN",
          "value": "東京"
        },
        "メモ": {
          "type": "MULTI_LINE_TEXT",
          "value": ""
        },
        "開催場所_地域": {
          "type": "DROP_DOWN",
          "value": "南関東"
        },
        "$revision": {
          "type": "__REVISION__",
          "value": "1"
        },
        "更新日時": {
          "type": "UPDATED_TIME",
          "value": "2020-12-02T06:16:00Z"
        },
        "作成日時": {
          "type": "CREATED_TIME",
          "value": "2020-12-02T06:16:00Z"
        },
        "日付": {
          "type": "DATE",
          "value": "2020-10-04"
        },
        "$id": {
          "type": "__ID__",
          "value": "23"
        }
      },
      {
        "イベント名": {
          "type": "SINGLE_LINE_TEXT",
          "value": "Maker Faire Tokyo 2020"
        },
        "レコード番号": {
          "type": "RECORD_NUMBER",
          "value": "22"
        },
        "都道府県": {
          "type": "DROP_DOWN",
          "value": "東京"
        },
        "メモ": {
          "type": "MULTI_LINE_TEXT",
          "value": ""
        },
        "開催場所_地域": {
          "type": "DROP_DOWN",
          "value": "南関東"
        },
        "$revision": {
          "type": "__REVISION__",
          "value": "1"
        },
        "更新日時": {
          "type": "UPDATED_TIME",
          "value": "2020-12-02T06:16:00Z"
        },
        "作成日時": {
          "type": "CREATED_TIME",
          "value": "2020-12-02T06:16:00Z"
        },
        "日付": {
          "type": "DATE",
          "value": "2020-10-03"
        },
        "$id": {
          "type": "__ID__",
          "value": "22"
        }
      },
      {
        "イベント名": {
          "type": "SINGLE_LINE_TEXT",
          "value": "kintone hack 予選会"
        },
        "レコード番号": {
          "type": "RECORD_NUMBER",
          "value": "21"
        },
        "都道府県": {
          "type": "DROP_DOWN",
          "value": null
        },
        "メモ": {
          "type": "MULTI_LINE_TEXT",
          "value": ""
        },
        "開催場所_地域": {
          "type": "DROP_DOWN",
          "value": null
        },
        "$revision": {
          "type": "__REVISION__",
          "value": "1"
        },
        "更新日時": {
          "type": "UPDATED_TIME",
          "value": "2020-12-02T06:15:00Z"
        },
        "作成日時": {
          "type": "CREATED_TIME",
          "value": "2020-12-02T06:15:00Z"
        },
        "日付": {
          "type": "DATE",
          "value": "2020-09-10"
        },
        "$id": {
          "type": "__ID__",
          "value": "21"
        }
      },
      {
        "イベント名": {
          "type": "SINGLE_LINE_TEXT",
          "value": "ONE JAPAN HACKATHON 2020 ハッカソン"
        },
        "レコード番号": {
          "type": "RECORD_NUMBER",
          "value": "20"
        },
        "都道府県": {
          "type": "DROP_DOWN",
          "value": null
        },
        "メモ": {
          "type": "MULTI_LINE_TEXT",
          "value": ""
        },
        "開催場所_地域": {
          "type": "DROP_DOWN",
          "value": null
        },
        "$revision": {
          "type": "__REVISION__",
          "value": "1"
        },
        "更新日時": {
          "type": "UPDATED_TIME",
          "value": "2020-12-02T06:14:00Z"
        },
        "作成日時": {
          "type": "CREATED_TIME",
          "value": "2020-12-02T06:14:00Z"
        },
        "日付": {
          "type": "DATE",
          "value": "2020-08-30"
        },
        "$id": {
          "type": "__ID__",
          "value": "20"
        }
      },
      {
        "イベント名": {
          "type": "SINGLE_LINE_TEXT",
          "value": "ONE JAPAN HACKATHON 2020 アイデアソン"
        },
        "レコード番号": {
          "type": "RECORD_NUMBER",
          "value": "19"
        },
        "都道府県": {
          "type": "DROP_DOWN",
          "value": null
        },
        "メモ": {
          "type": "MULTI_LINE_TEXT",
          "value": ""
        },
        "開催場所_地域": {
          "type": "DROP_DOWN",
          "value": null
        },
        "$revision": {
          "type": "__REVISION__",
          "value": "1"
        },
        "更新日時": {
          "type": "UPDATED_TIME",
          "value": "2020-12-02T06:13:00Z"
        },
        "作成日時": {
          "type": "CREATED_TIME",
          "value": "2020-12-02T06:13:00Z"
        },
        "日付": {
          "type": "DATE",
          "value": "2020-08-22"
        },
        "$id": {
          "type": "__ID__",
          "value": "19"
        }
      },
      {
        "イベント名": {
          "type": "SINGLE_LINE_TEXT",
          "value": "kintone devCamp Step3 ②"
        },
        "レコード番号": {
          "type": "RECORD_NUMBER",
          "value": "18"
        },
        "都道府県": {
          "type": "DROP_DOWN",
          "value": null
        },
        "メモ": {
          "type": "MULTI_LINE_TEXT",
          "value": ""
        },
        "開催場所_地域": {
          "type": "DROP_DOWN",
          "value": null
        },
        "$revision": {
          "type": "__REVISION__",
          "value": "1"
        },
        "更新日時": {
          "type": "UPDATED_TIME",
          "value": "2020-12-02T06:13:00Z"
        },
        "作成日時": {
          "type": "CREATED_TIME",
          "value": "2020-12-02T06:13:00Z"
        },
        "日付": {
          "type": "DATE",
          "value": "2020-08-04"
        },
        "$id": {
          "type": "__ID__",
          "value": "18"
        }
      },
      {
        "イベント名": {
          "type": "SINGLE_LINE_TEXT",
          "value": "kintone devCamp Step3 ①"
        },
        "レコード番号": {
          "type": "RECORD_NUMBER",
          "value": "17"
        },
        "都道府県": {
          "type": "DROP_DOWN",
          "value": null
        },
        "メモ": {
          "type": "MULTI_LINE_TEXT",
          "value": ""
        },
        "開催場所_地域": {
          "type": "DROP_DOWN",
          "value": null
        },
        "$revision": {
          "type": "__REVISION__",
          "value": "1"
        },
        "更新日時": {
          "type": "UPDATED_TIME",
          "value": "2020-12-02T06:13:00Z"
        },
        "作成日時": {
          "type": "CREATED_TIME",
          "value": "2020-12-02T06:13:00Z"
        },
        "日付": {
          "type": "DATE",
          "value": "2020-07-30"
        },
        "$id": {
          "type": "__ID__",
          "value": "17"
        }
      },
      {
        "イベント名": {
          "type": "SINGLE_LINE_TEXT",
          "value": "kintone devCamp Step2 ②"
        },
        "レコード番号": {
          "type": "RECORD_NUMBER",
          "value": "16"
        },
        "都道府県": {
          "type": "DROP_DOWN",
          "value": null
        },
        "メモ": {
          "type": "MULTI_LINE_TEXT",
          "value": ""
        },
        "開催場所_地域": {
          "type": "DROP_DOWN",
          "value": null
        },
        "$revision": {
          "type": "__REVISION__",
          "value": "1"
        },
        "更新日時": {
          "type": "UPDATED_TIME",
          "value": "2020-12-02T06:13:00Z"
        },
        "作成日時": {
          "type": "CREATED_TIME",
          "value": "2020-12-02T06:13:00Z"
        },
        "日付": {
          "type": "DATE",
          "value": "2020-07-21"
        },
        "$id": {
          "type": "__ID__",
          "value": "16"
        }
      },
      {
        "イベント名": {
          "type": "SINGLE_LINE_TEXT",
          "value": "kintone devCamp Step2 ①"
        },
        "レコード番号": {
          "type": "RECORD_NUMBER",
          "value": "15"
        },
        "都道府県": {
          "type": "DROP_DOWN",
          "value": null
        },
        "メモ": {
          "type": "MULTI_LINE_TEXT",
          "value": ""
        },
        "開催場所_地域": {
          "type": "DROP_DOWN",
          "value": null
        },
        "$revision": {
          "type": "__REVISION__",
          "value": "1"
        },
        "更新日時": {
          "type": "UPDATED_TIME",
          "value": "2020-12-02T06:13:00Z"
        },
        "作成日時": {
          "type": "CREATED_TIME",
          "value": "2020-12-02T06:13:00Z"
        },
        "日付": {
          "type": "DATE",
          "value": "2020-07-16"
        },
        "$id": {
          "type": "__ID__",
          "value": "15"
        }
      },
      {
        "イベント名": {
          "type": "SINGLE_LINE_TEXT",
          "value": "kintone devCamp Step1 ②"
        },
        "レコード番号": {
          "type": "RECORD_NUMBER",
          "value": "14"
        },
        "都道府県": {
          "type": "DROP_DOWN",
          "value": null
        },
        "メモ": {
          "type": "MULTI_LINE_TEXT",
          "value": ""
        },
        "開催場所_地域": {
          "type": "DROP_DOWN",
          "value": null
        },
        "$revision": {
          "type": "__REVISION__",
          "value": "1"
        },
        "更新日時": {
          "type": "UPDATED_TIME",
          "value": "2020-12-02T06:12:00Z"
        },
        "作成日時": {
          "type": "CREATED_TIME",
          "value": "2020-12-02T06:12:00Z"
        },
        "日付": {
          "type": "DATE",
          "value": "2020-07-07"
        },
        "$id": {
          "type": "__ID__",
          "value": "14"
        }
      },
      {
        "イベント名": {
          "type": "SINGLE_LINE_TEXT",
          "value": "kintone devCamp Step1 ①"
        },
        "レコード番号": {
          "type": "RECORD_NUMBER",
          "value": "13"
        },
        "都道府県": {
          "type": "DROP_DOWN",
          "value": null
        },
        "メモ": {
          "type": "MULTI_LINE_TEXT",
          "value": ""
        },
        "開催場所_地域": {
          "type": "DROP_DOWN",
          "value": null
        },
        "$revision": {
          "type": "__REVISION__",
          "value": "1"
        },
        "更新日時": {
          "type": "UPDATED_TIME",
          "value": "2020-12-02T06:12:00Z"
        },
        "作成日時": {
          "type": "CREATED_TIME",
          "value": "2020-12-02T06:12:00Z"
        },
        "日付": {
          "type": "DATE",
          "value": "2020-07-02"
        },
        "$id": {
          "type": "__ID__",
          "value": "13"
        }
      },
      {
        "イベント名": {
          "type": "SINGLE_LINE_TEXT",
          "value": "LINE×kintone×Azureでテイクアウトアプリを作ってみよう！"
        },
        "レコード番号": {
          "type": "RECORD_NUMBER",
          "value": "12"
        },
        "都道府県": {
          "type": "DROP_DOWN",
          "value": null
        },
        "メモ": {
          "type": "MULTI_LINE_TEXT",
          "value": ""
        },
        "開催場所_地域": {
          "type": "DROP_DOWN",
          "value": null
        },
        "$revision": {
          "type": "__REVISION__",
          "value": "1"
        },
        "更新日時": {
          "type": "UPDATED_TIME",
          "value": "2020-12-02T06:12:00Z"
        },
        "作成日時": {
          "type": "CREATED_TIME",
          "value": "2020-12-02T06:12:00Z"
        },
        "日付": {
          "type": "DATE",
          "value": "2020-06-09"
        },
        "$id": {
          "type": "__ID__",
          "value": "12"
        }
      },
      {
        "イベント名": {
          "type": "SINGLE_LINE_TEXT",
          "value": "One Japan ハッカソン オンライン発表会"
        },
        "レコード番号": {
          "type": "RECORD_NUMBER",
          "value": "11"
        },
        "都道府県": {
          "type": "DROP_DOWN",
          "value": null
        },
        "メモ": {
          "type": "MULTI_LINE_TEXT",
          "value": ""
        },
        "開催場所_地域": {
          "type": "DROP_DOWN",
          "value": null
        },
        "$revision": {
          "type": "__REVISION__",
          "value": "1"
        },
        "更新日時": {
          "type": "UPDATED_TIME",
          "value": "2020-12-02T06:12:00Z"
        },
        "作成日時": {
          "type": "CREATED_TIME",
          "value": "2020-12-02T06:12:00Z"
        },
        "日付": {
          "type": "DATE",
          "value": "2020-05-24"
        },
        "$id": {
          "type": "__ID__",
          "value": "11"
        }
      },
      {
        "イベント名": {
          "type": "SINGLE_LINE_TEXT",
          "value": "LINE × kintoneでアンケートシステムを作ってみよう！"
        },
        "レコード番号": {
          "type": "RECORD_NUMBER",
          "value": "10"
        },
        "都道府県": {
          "type": "DROP_DOWN",
          "value": null
        },
        "メモ": {
          "type": "MULTI_LINE_TEXT",
          "value": ""
        },
        "開催場所_地域": {
          "type": "DROP_DOWN",
          "value": null
        },
        "$revision": {
          "type": "__REVISION__",
          "value": "1"
        },
        "更新日時": {
          "type": "UPDATED_TIME",
          "value": "2020-12-02T06:12:00Z"
        },
        "作成日時": {
          "type": "CREATED_TIME",
          "value": "2020-12-02T06:12:00Z"
        },
        "日付": {
          "type": "DATE",
          "value": "2020-05-11"
        },
        "$id": {
          "type": "__ID__",
          "value": "10"
        }
      },
      {
        "イベント名": {
          "type": "SINGLE_LINE_TEXT",
          "value": "GW特別企画！コーディング vs ノンコーディング対決"
        },
        "レコード番号": {
          "type": "RECORD_NUMBER",
          "value": "9"
        },
        "都道府県": {
          "type": "DROP_DOWN",
          "value": null
        },
        "メモ": {
          "type": "MULTI_LINE_TEXT",
          "value": ""
        },
        "開催場所_地域": {
          "type": "DROP_DOWN",
          "value": null
        },
        "$revision": {
          "type": "__REVISION__",
          "value": "1"
        },
        "更新日時": {
          "type": "UPDATED_TIME",
          "value": "2020-12-02T06:11:00Z"
        },
        "作成日時": {
          "type": "CREATED_TIME",
          "value": "2020-12-02T06:11:00Z"
        },
        "日付": {
          "type": "DATE",
          "value": "2020-05-04"
        },
        "$id": {
          "type": "__ID__",
          "value": "9"
        }
      },
      {
        "イベント名": {
          "type": "SINGLE_LINE_TEXT",
          "value": "RPALT"
        },
        "レコード番号": {
          "type": "RECORD_NUMBER",
          "value": "8"
        },
        "都道府県": {
          "type": "DROP_DOWN",
          "value": null
        },
        "メモ": {
          "type": "MULTI_LINE_TEXT",
          "value": ""
        },
        "開催場所_地域": {
          "type": "DROP_DOWN",
          "value": null
        },
        "$revision": {
          "type": "__REVISION__",
          "value": "1"
        },
        "更新日時": {
          "type": "UPDATED_TIME",
          "value": "2020-12-02T06:11:00Z"
        },
        "作成日時": {
          "type": "CREATED_TIME",
          "value": "2020-12-02T06:11:00Z"
        },
        "日付": {
          "type": "DATE",
          "value": "2020-04-20"
        },
        "$id": {
          "type": "__ID__",
          "value": "8"
        }
      },
      {
        "イベント名": {
          "type": "SINGLE_LINE_TEXT",
          "value": "kintone hive nagoya"
        },
        "レコード番号": {
          "type": "RECORD_NUMBER",
          "value": "7"
        },
        "都道府県": {
          "type": "DROP_DOWN",
          "value": "愛知"
        },
        "メモ": {
          "type": "MULTI_LINE_TEXT",
          "value": ""
        },
        "開催場所_地域": {
          "type": "DROP_DOWN",
          "value": "東海"
        },
        "$revision": {
          "type": "__REVISION__",
          "value": "2"
        },
        "更新日時": {
          "type": "UPDATED_TIME",
          "value": "2020-12-02T06:11:00Z"
        },
        "作成日時": {
          "type": "CREATED_TIME",
          "value": "2020-12-02T06:10:00Z"
        },
        "日付": {
          "type": "DATE",
          "value": "2020-02-25"
        },
        "$id": {
          "type": "__ID__",
          "value": "7"
        }
      },
      {
        "イベント名": {
          "type": "SINGLE_LINE_TEXT",
          "value": "One Japan ハッカソン"
        },
        "レコード番号": {
          "type": "RECORD_NUMBER",
          "value": "6"
        },
        "都道府県": {
          "type": "DROP_DOWN",
          "value": "愛知"
        },
        "メモ": {
          "type": "MULTI_LINE_TEXT",
          "value": ""
        },
        "開催場所_地域": {
          "type": "DROP_DOWN",
          "value": "東海"
        },
        "$revision": {
          "type": "__REVISION__",
          "value": "1"
        },
        "更新日時": {
          "type": "UPDATED_TIME",
          "value": "2020-12-02T06:10:00Z"
        },
        "作成日時": {
          "type": "CREATED_TIME",
          "value": "2020-12-02T06:10:00Z"
        },
        "日付": {
          "type": "DATE",
          "value": "2020-02-15"
        },
        "$id": {
          "type": "__ID__",
          "value": "6"
        }
      },
      {
        "イベント名": {
          "type": "SINGLE_LINE_TEXT",
          "value": "トヨタハッカソン"
        },
        "レコード番号": {
          "type": "RECORD_NUMBER",
          "value": "5"
        },
        "都道府県": {
          "type": "DROP_DOWN",
          "value": "愛知"
        },
        "メモ": {
          "type": "MULTI_LINE_TEXT",
          "value": ""
        },
        "開催場所_地域": {
          "type": "DROP_DOWN",
          "value": "東海"
        },
        "$revision": {
          "type": "__REVISION__",
          "value": "1"
        },
        "更新日時": {
          "type": "UPDATED_TIME",
          "value": "2020-12-02T06:09:00Z"
        },
        "作成日時": {
          "type": "CREATED_TIME",
          "value": "2020-12-02T06:09:00Z"
        },
        "日付": {
          "type": "DATE",
          "value": "2020-02-09"
        },
        "$id": {
          "type": "__ID__",
          "value": "5"
        }
      },
      {
        "イベント名": {
          "type": "SINGLE_LINE_TEXT",
          "value": "LINE連携ハンズオン"
        },
        "レコード番号": {
          "type": "RECORD_NUMBER",
          "value": "4"
        },
        "都道府県": {
          "type": "DROP_DOWN",
          "value": "愛知"
        },
        "メモ": {
          "type": "MULTI_LINE_TEXT",
          "value": ""
        },
        "開催場所_地域": {
          "type": "DROP_DOWN",
          "value": "東海"
        },
        "$revision": {
          "type": "__REVISION__",
          "value": "2"
        },
        "更新日時": {
          "type": "UPDATED_TIME",
          "value": "2020-12-02T06:10:00Z"
        },
        "作成日時": {
          "type": "CREATED_TIME",
          "value": "2020-12-02T06:08:00Z"
        },
        "日付": {
          "type": "DATE",
          "value": "2020-02-07"
        },
        "$id": {
          "type": "__ID__",
          "value": "4"
        }
      },
      {
        "イベント名": {
          "type": "SINGLE_LINE_TEXT",
          "value": "kintone devCamp Step3@福岡"
        },
        "レコード番号": {
          "type": "RECORD_NUMBER",
          "value": "3"
        },
        "都道府県": {
          "type": "DROP_DOWN",
          "value": null
        },
        "メモ": {
          "type": "MULTI_LINE_TEXT",
          "value": ""
        },
        "開催場所_地域": {
          "type": "DROP_DOWN",
          "value": null
        },
        "$revision": {
          "type": "__REVISION__",
          "value": "2"
        },
        "更新日時": {
          "type": "UPDATED_TIME",
          "value": "2020-12-02T07:50:00Z"
        },
        "作成日時": {
          "type": "CREATED_TIME",
          "value": "2020-12-02T06:08:00Z"
        },
        "日付": {
          "type": "DATE",
          "value": "2020-04-23"
        },
        "$id": {
          "type": "__ID__",
          "value": "3"
        }
      },
      {
        "イベント名": {
          "type": "SINGLE_LINE_TEXT",
          "value": "kintone devCamp Step2@福岡"
        },
        "レコード番号": {
          "type": "RECORD_NUMBER",
          "value": "2"
        },
        "都道府県": {
          "type": "DROP_DOWN",
          "value": "福岡"
        },
        "メモ": {
          "type": "MULTI_LINE_TEXT",
          "value": ""
        },
        "開催場所_地域": {
          "type": "DROP_DOWN",
          "value": "九州"
        },
        "$revision": {
          "type": "__REVISION__",
          "value": "1"
        },
        "更新日時": {
          "type": "UPDATED_TIME",
          "value": "2020-12-02T06:08:00Z"
        },
        "作成日時": {
          "type": "CREATED_TIME",
          "value": "2020-12-02T06:08:00Z"
        },
        "日付": {
          "type": "DATE",
          "value": "2020-02-13"
        },
        "$id": {
          "type": "__ID__",
          "value": "2"
        }
      },
      {
        "イベント名": {
          "type": "SINGLE_LINE_TEXT",
          "value": "kintone devCamp Step1@福岡"
        },
        "レコード番号": {
          "type": "RECORD_NUMBER",
          "value": "1"
        },
        "都道府県": {
          "type": "DROP_DOWN",
          "value": "福岡"
        },
        "メモ": {
          "type": "MULTI_LINE_TEXT",
          "value": ""
        },
        "開催場所_地域": {
          "type": "DROP_DOWN",
          "value": "九州"
        },
        "$revision": {
          "type": "__REVISION__",
          "value": "1"
        },
        "更新日時": {
          "type": "UPDATED_TIME",
          "value": "2020-12-02T06:07:00Z"
        },
        "作成日時": {
          "type": "CREATED_TIME",
          "value": "2020-12-02T06:07:00Z"
        },
        "日付": {
          "type": "DATE",
          "value": "2020-01-30"
        },
        "$id": {
          "type": "__ID__",
          "value": "1"
        }
      }
    ];

    var recordsData = {
    	records: records
    };

    /* src/App.svelte generated by Svelte v3.31.0 */
    const file = "src/App.svelte";

    function get_each_context(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[5] = list[i];
    	return child_ctx;
    }

    function get_each_context_1(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    function get_each_context_2(ctx, list, i) {
    	const child_ctx = ctx.slice();
    	child_ctx[8] = list[i];
    	return child_ctx;
    }

    // (1:0) <script>    // async function getRecords() {   //   const app = 914;   //   const query = 'order by $id desc limit 500';   //   const data = await kintone.api(kintone.api.url('/k/v1/records'), 'GET', {app, query}
    function create_catch_block(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_catch_block.name,
    		type: "catch",
    		source: "(1:0) <script>    // async function getRecords() {   //   const app = 914;   //   const query = 'order by $id desc limit 500';   //   const data = await kintone.api(kintone.api.url('/k/v1/records'), 'GET', {app, query}",
    		ctx
    	});

    	return block;
    }

    // (58:34)      <table class="origin-table recordlist-gaia">       <thead>         {#each fields as field}
    function create_then_block(ctx) {
    	let table;
    	let thead;
    	let t;
    	let tbody;
    	let each_value_2 = /*fields*/ ctx[2];
    	validate_each_argument(each_value_2);
    	let each_blocks_1 = [];

    	for (let i = 0; i < each_value_2.length; i += 1) {
    		each_blocks_1[i] = create_each_block_2(get_each_context_2(ctx, each_value_2, i));
    	}

    	let each_value = /*recordsData*/ ctx[0];
    	validate_each_argument(each_value);
    	let each_blocks = [];

    	for (let i = 0; i < each_value.length; i += 1) {
    		each_blocks[i] = create_each_block(get_each_context(ctx, each_value, i));
    	}

    	const block = {
    		c: function create() {
    			table = element("table");
    			thead = element("thead");

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].c();
    			}

    			t = space();
    			tbody = element("tbody");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			add_location(thead, file, 59, 6, 1913);
    			add_location(tbody, file, 64, 6, 2119);
    			attr_dev(table, "class", "origin-table recordlist-gaia svelte-1w7evxi");
    			add_location(table, file, 58, 4, 1862);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, table, anchor);
    			append_dev(table, thead);

    			for (let i = 0; i < each_blocks_1.length; i += 1) {
    				each_blocks_1[i].m(thead, null);
    			}

    			append_dev(table, t);
    			append_dev(table, tbody);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tbody, null);
    			}
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*sortData, fields, sortflag*/ 14) {
    				each_value_2 = /*fields*/ ctx[2];
    				validate_each_argument(each_value_2);
    				let i;

    				for (i = 0; i < each_value_2.length; i += 1) {
    					const child_ctx = get_each_context_2(ctx, each_value_2, i);

    					if (each_blocks_1[i]) {
    						each_blocks_1[i].p(child_ctx, dirty);
    					} else {
    						each_blocks_1[i] = create_each_block_2(child_ctx);
    						each_blocks_1[i].c();
    						each_blocks_1[i].m(thead, null);
    					}
    				}

    				for (; i < each_blocks_1.length; i += 1) {
    					each_blocks_1[i].d(1);
    				}

    				each_blocks_1.length = each_value_2.length;
    			}

    			if (dirty & /*fields, recordsData*/ 5) {
    				each_value = /*recordsData*/ ctx[0];
    				validate_each_argument(each_value);
    				let i;

    				for (i = 0; i < each_value.length; i += 1) {
    					const child_ctx = get_each_context(ctx, each_value, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tbody, null);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(table);
    			destroy_each(each_blocks_1, detaching);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_then_block.name,
    		type: "then",
    		source: "(58:34)      <table class=\\\"origin-table recordlist-gaia\\\">       <thead>         {#each fields as field}",
    		ctx
    	});

    	return block;
    }

    // (61:8) {#each fields as field}
    function create_each_block_2(ctx) {
    	let th;
    	let t0_value = /*field*/ ctx[8] + "";
    	let t0;
    	let t1;
    	let t2_value = (/*sortflag*/ ctx[1][/*field*/ ctx[8]] || "") + "";
    	let t2;
    	let mounted;
    	let dispose;

    	function click_handler() {
    		return /*click_handler*/ ctx[4](/*field*/ ctx[8]);
    	}

    	const block = {
    		c: function create() {
    			th = element("th");
    			t0 = text(t0_value);
    			t1 = space();
    			t2 = text(t2_value);
    			attr_dev(th, "class", "origin-th recordlist-header-cell-gaia svelte-1w7evxi");
    			add_location(th, file, 61, 10, 1963);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, th, anchor);
    			append_dev(th, t0);
    			append_dev(th, t1);
    			append_dev(th, t2);

    			if (!mounted) {
    				dispose = listen_dev(th, "click", click_handler, false, false, false);
    				mounted = true;
    			}
    		},
    		p: function update(new_ctx, dirty) {
    			ctx = new_ctx;
    			if (dirty & /*sortflag*/ 2 && t2_value !== (t2_value = (/*sortflag*/ ctx[1][/*field*/ ctx[8]] || "") + "")) set_data_dev(t2, t2_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(th);
    			mounted = false;
    			dispose();
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_2.name,
    		type: "each",
    		source: "(61:8) {#each fields as field}",
    		ctx
    	});

    	return block;
    }

    // (68:12) {#each fields as field}
    function create_each_block_1(ctx) {
    	let td;
    	let t_value = /*record*/ ctx[5][/*field*/ ctx[8]].value + "";
    	let t;

    	const block = {
    		c: function create() {
    			td = element("td");
    			t = text(t_value);
    			attr_dev(td, "class", "origin-td recordlist-cell-gaia svelte-1w7evxi");
    			add_location(td, file, 68, 14, 2268);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, td, anchor);
    			append_dev(td, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*recordsData*/ 1 && t_value !== (t_value = /*record*/ ctx[5][/*field*/ ctx[8]].value + "")) set_data_dev(t, t_value);
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(td);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block_1.name,
    		type: "each",
    		source: "(68:12) {#each fields as field}",
    		ctx
    	});

    	return block;
    }

    // (66:8) {#each recordsData as record}
    function create_each_block(ctx) {
    	let tr;
    	let t;
    	let each_value_1 = /*fields*/ ctx[2];
    	validate_each_argument(each_value_1);
    	let each_blocks = [];

    	for (let i = 0; i < each_value_1.length; i += 1) {
    		each_blocks[i] = create_each_block_1(get_each_context_1(ctx, each_value_1, i));
    	}

    	const block = {
    		c: function create() {
    			tr = element("tr");

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].c();
    			}

    			t = space();
    			attr_dev(tr, "class", "origin-tr recordlist-row-gaia svelte-1w7evxi");
    			add_location(tr, file, 66, 10, 2175);
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, tr, anchor);

    			for (let i = 0; i < each_blocks.length; i += 1) {
    				each_blocks[i].m(tr, null);
    			}

    			append_dev(tr, t);
    		},
    		p: function update(ctx, dirty) {
    			if (dirty & /*recordsData, fields*/ 5) {
    				each_value_1 = /*fields*/ ctx[2];
    				validate_each_argument(each_value_1);
    				let i;

    				for (i = 0; i < each_value_1.length; i += 1) {
    					const child_ctx = get_each_context_1(ctx, each_value_1, i);

    					if (each_blocks[i]) {
    						each_blocks[i].p(child_ctx, dirty);
    					} else {
    						each_blocks[i] = create_each_block_1(child_ctx);
    						each_blocks[i].c();
    						each_blocks[i].m(tr, t);
    					}
    				}

    				for (; i < each_blocks.length; i += 1) {
    					each_blocks[i].d(1);
    				}

    				each_blocks.length = each_value_1.length;
    			}
    		},
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(tr);
    			destroy_each(each_blocks, detaching);
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_each_block.name,
    		type: "each",
    		source: "(66:8) {#each recordsData as record}",
    		ctx
    	});

    	return block;
    }

    // (1:0) <script>    // async function getRecords() {   //   const app = 914;   //   const query = 'order by $id desc limit 500';   //   const data = await kintone.api(kintone.api.url('/k/v1/records'), 'GET', {app, query}
    function create_pending_block(ctx) {
    	const block = { c: noop, m: noop, p: noop, d: noop };

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_pending_block.name,
    		type: "pending",
    		source: "(1:0) <script>    // async function getRecords() {   //   const app = 914;   //   const query = 'order by $id desc limit 500';   //   const data = await kintone.api(kintone.api.url('/k/v1/records'), 'GET', {app, query}",
    		ctx
    	});

    	return block;
    }

    function create_fragment(ctx) {
    	let main;
    	let div5;
    	let div0;
    	let p0;
    	let t1;
    	let div1;
    	let t2;
    	let div2;
    	let p1;
    	let t4;
    	let div3;
    	let t6;
    	let div4;
    	let t7;
    	let promise;

    	let info = {
    		ctx,
    		current: null,
    		token: null,
    		hasCatch: false,
    		pending: create_pending_block,
    		then: create_then_block,
    		catch: create_catch_block,
    		value: 5
    	};

    	handle_promise(promise = /*recordsData*/ ctx[0], info);

    	const block = {
    		c: function create() {
    			main = element("main");
    			div5 = element("div");
    			div0 = element("div");
    			p0 = element("p");
    			p0.textContent = "☁ kintone";
    			t1 = space();
    			div1 = element("div");
    			t2 = space();
    			div2 = element("div");
    			p1 = element("p");
    			p1.textContent = "Svelteで一覧作ってみた";
    			t4 = space();
    			div3 = element("div");
    			div3.textContent = "🏠 ＞ スペース: 一覧自作 ＞ アプリ：Svelte一覧";
    			t6 = space();
    			div4 = element("div");
    			t7 = space();
    			info.block.c();
    			attr_dev(p0, "class", "svelte-1w7evxi");
    			add_location(p0, file, 51, 24, 1584);
    			attr_dev(div0, "class", "header svelte-1w7evxi");
    			add_location(div0, file, 51, 4, 1564);
    			attr_dev(div1, "class", "header-black svelte-1w7evxi");
    			add_location(div1, file, 52, 4, 1611);
    			attr_dev(p1, "class", "svelte-1w7evxi");
    			add_location(p1, file, 53, 30, 1674);
    			attr_dev(div2, "class", "header-image svelte-1w7evxi");
    			add_location(div2, file, 53, 4, 1648);
    			attr_dev(div3, "class", "app-index-bread svelte-1w7evxi");
    			add_location(div3, file, 54, 4, 1706);
    			attr_dev(div4, "class", "app-index-toolbar svelte-1w7evxi");
    			add_location(div4, file, 55, 4, 1776);
    			attr_dev(div5, "class", "container");
    			add_location(div5, file, 50, 2, 1536);
    			add_location(main, file, 49, 0, 1527);
    		},
    		l: function claim(nodes) {
    			throw new Error("options.hydrate only works if the component was compiled with the `hydratable: true` option");
    		},
    		m: function mount(target, anchor) {
    			insert_dev(target, main, anchor);
    			append_dev(main, div5);
    			append_dev(div5, div0);
    			append_dev(div0, p0);
    			append_dev(div5, t1);
    			append_dev(div5, div1);
    			append_dev(div5, t2);
    			append_dev(div5, div2);
    			append_dev(div2, p1);
    			append_dev(div5, t4);
    			append_dev(div5, div3);
    			append_dev(div5, t6);
    			append_dev(div5, div4);
    			append_dev(main, t7);
    			info.block.m(main, info.anchor = null);
    			info.mount = () => main;
    			info.anchor = null;
    		},
    		p: function update(new_ctx, [dirty]) {
    			ctx = new_ctx;
    			info.ctx = ctx;

    			if (dirty & /*recordsData*/ 1 && promise !== (promise = /*recordsData*/ ctx[0]) && handle_promise(promise, info)) ; else {
    				const child_ctx = ctx.slice();
    				child_ctx[5] = info.resolved;
    				info.block.p(child_ctx, dirty);
    			}
    		},
    		i: noop,
    		o: noop,
    		d: function destroy(detaching) {
    			if (detaching) detach_dev(main);
    			info.block.d();
    			info.token = null;
    			info = null;
    		}
    	};

    	dispatch_dev("SvelteRegisterBlock", {
    		block,
    		id: create_fragment.name,
    		type: "component",
    		source: "",
    		ctx
    	});

    	return block;
    }

    function instance($$self, $$props, $$invalidate) {
    	let { $$slots: slots = {}, $$scope } = $$props;
    	validate_slots("App", slots, []);
    	const fields = ["レコード番号", "日付", "イベント名", "都道府県"];

    	recordsData.records.forEach(val => {
    		val["レコード番号"].value = Number(val["レコード番号"].value);
    		if (!val["都道府県"].value) val["都道府県"].value = "オンライン";
    	});

    	let recordsData$1 = recordsData.records;
    	let sortflag = { data: "", desc: false };

    	function sortData(header) {
    		// すでにソートがされているかで分岐
    		if (sortflag.data !== header) {
    			// まだソートしてないフィールドが選ばれたら、降順にする
    			$$invalidate(0, recordsData$1 = recordsData$1.sort((x, y) => x[header].value < y[header].value ? 1 : -1));

    			$$invalidate(1, sortflag = { data: header, desc: true, [header]: "↓" });
    			return;
    		}

    		// すでにソートしているフィールドが選ばれたら、現在が昇順/降順どちらか確認してその逆順にする
    		const num = sortflag.desc ? -1 : 1; // descがtrueなら昇順、falseなら降順

    		$$invalidate(0, recordsData$1 = recordsData$1.sort((x, y) => x[header].value < y[header].value ? num : num * -1));

    		$$invalidate(1, sortflag = {
    			data: header,
    			desc: num === 1,
    			[header]: num === 1 ? "↓" : "↑"
    		});
    	}

    	
    	const writable_props = [];

    	Object.keys($$props).forEach(key => {
    		if (!~writable_props.indexOf(key) && key.slice(0, 2) !== "$$") console.warn(`<App> was created with unknown prop '${key}'`);
    	});

    	const click_handler = field => sortData(field);

    	$$self.$capture_state = () => ({
    		fields,
    		data: recordsData,
    		recordsData: recordsData$1,
    		sortflag,
    		sortData
    	});

    	$$self.$inject_state = $$props => {
    		if ("recordsData" in $$props) $$invalidate(0, recordsData$1 = $$props.recordsData);
    		if ("sortflag" in $$props) $$invalidate(1, sortflag = $$props.sortflag);
    	};

    	if ($$props && "$$inject" in $$props) {
    		$$self.$inject_state($$props.$$inject);
    	}

    	return [recordsData$1, sortflag, fields, sortData, click_handler];
    }

    class App extends SvelteComponentDev {
    	constructor(options) {
    		super(options);
    		init(this, options, instance, create_fragment, safe_not_equal, {});

    		dispatch_dev("SvelteRegisterComponent", {
    			component: this,
    			tagName: "App",
    			options,
    			id: create_fragment.name
    		});
    	}
    }

    const app = new App({
    	target: document.body,
    });

    return app;

}());
//# sourceMappingURL=bundle.js.map
