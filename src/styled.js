import { css } from './css';
import { parse } from './core/parse';

let h, useTheme, fwdProp, fwdRef;
let withMemo = function (comp) {
    return comp;
};

/**
 *
 * @param {*} pragma
 * @param {*} config
 */
function setup(
    pragma,
    { prefix = '', theme = null, forwardProps = null, forwardRef = null, memo = withMemo } = {}
) {
    // This one needs to stay in here, so we won't have cyclic dependencies
    parse.p = prefix;
    // These are scope to this context
    h = pragma;
    useTheme = theme;
    fwdProp = forwardProps;
    fwdRef = forwardRef;
    withMemo = memo;
}

/**
 * styled function
 * @param {string} tag
 */
function styled(tag) {
    let _ctx = this || {};

    return function wrapper() {
        let _args = arguments;
        function Styled(props, ref) {
            // Grab a shallow copy of the props
            let _props = Object.assign({}, props);

            // _ctx.p: is the props sent to the context
            _ctx.p = Object.assign({ theme: useTheme && useTheme() }, _props);

            _ctx.style = _props.style || Object.assign({}, _props.style);

            // Set a flag if the current components had a previous className
            // similar to goober. This is the append/prepend flag
            // The _empty_ space compresses better than `\s`
            const cssObj = css.apply(_ctx, _args);

            // If the fwdRef fun is defined we have the ref
            if (fwdRef && ref && (typeof ref === 'function' || ref.hasOwnProperty('current'))) {
                _props.ref = ref;
            }

            _props.style = _ctx.style = cssObj.RNStyle;

            // Assign the _as with the provided `tag` value
            let _as = tag;

            // If this is a string -- checking that is has a first valid char
            if (tag[0]) {
                // Try to assign the _as with the given _as value if any
                _as = _props.as || tag;
                // And remove it
                delete _props.as;
            }

            // Handle the forward props filter if defined and _as is a string
            if (fwdProp && _as[0]) {
                fwdProp(_props);
            }

            return h(_as, _props);
        }

        // ref 转发
        return withMemo(fwdRef && typeof fwdRef === 'function' ? fwdRef(Styled) : Styled);
    };
}

export { styled, setup };
