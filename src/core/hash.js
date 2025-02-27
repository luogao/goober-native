import { toHash } from './to-hash';
import { update } from './update';
import { astish } from './astish';
import { parse } from './parse';
import transformDeclPairs from 'css-to-react-native';

let generated = {};
/**
 * In-memory cache.
 */
let cache = {};

/**
 * Stringifies a object structure
 * @param {Object} data
 * @returns {String}
 */
let stringify = (data) => {
    if (typeof data == 'object') {
        let out = '';
        for (let p in data) out += p + stringify(data[p]);
        return out;
    } else {
        return data;
    }
};

/**
 * Generates the needed className
 * @param {String|Object} compiled
 * @param {Object} global Global flag
 * @param {Boolean} append Append or not
 * @param {Boolean} keyframes Keyframes mode. The input is the keyframes body that needs to be wrapped.
 * @param {Object} RNStyle
 * @returns {String}
 */
export let hash = (compiled, global, append, keyframes, RNStyle) => {
    // Get a string representation of the object or the value that is called 'compiled'
    let stringifiedCompiled = stringify(compiled);
    // Retrieve the className from cache or hash it in place
    let className =
        cache[stringifiedCompiled] || (cache[stringifiedCompiled] = toHash(stringifiedCompiled));

    console.log({ stringifiedCompiled });

    // If there's no entry for the current className
    if (!cache[className]) {
        // Build the _ast_-ish structure if needed
        let ast = stringifiedCompiled !== compiled ? compiled : astish(compiled);

        // Parse it
        cache[className] = parse(
            // For keyframes
            keyframes ? { ['@keyframes ' + className]: ast } : ast,
            global ? '' : '.' + className
        );
    }

    // If the global flag is set, save the current stringified and compiled CSS to `cache.g`
    // to allow replacing styles in <style /> instead of appending them.
    // This is required for using `createGlobalStyles` with themes
    let cssToReplace = global && cache.g ? cache.g : null;
    if (global) cache.g = cache[className];

    // add or update
    // update(cache[className], sheet, append, cssToReplace);

    // RN currently does not support differing values for the corner radii of Image
    // components (but does for View). It is almost impossible to tell whether we'll have
    // support, so we'll just disable multiple values here.
    // https://github.com/styled-components/css-to-react-native/issues/11
    const css = cache[className].replace(`.${className}{`, '').replace('}', '');
    const declPairs = css
        .split(';')
        .filter((cssRule) => cssRule)
        .map((cssRule) => cssRule.split(':'));

    const styleObject = transformDeclPairs(declPairs, [
        'borderRadius',
        'borderWidth',
        'borderColor',
        'borderStyle'
    ]);

    const styles = Object.assign(styleObject, {});

    RNStyle = RNStyle ? { ...styles, ...RNStyle } : styles.generated;

    // return hash
    return { className, RNStyle };
};
