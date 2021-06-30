import { PREFIX } from './constants';

/**
 * Prefix a name/string/identifier with the Open Forms specific prefix.
 */
const applyPrefix = (name) => {
  return `${PREFIX}-${name}`;
};

const isValidBsn = (value) => {
    if (value.length !== 9) {
      return false;
    }

    // Formula taken from https://nl.wikipedia.org/wiki/Burgerservicenummer#11-proef
    const newValue = (9 * parseInt(value[0])) + (8 * parseInt(value[1])) + (7 * parseInt(value[2])) +
                      (6 * parseInt(value[3])) + (5 * parseInt(value[4])) + (4 * parseInt(value[5])) +
                      (3 * parseInt(value[6])) + (2 * parseInt(value[7])) + (-1 * parseInt(value[8]));

    if (isNaN(newValue)) {
      return false;
    }

    return newValue % 11 === 0;
};

export { applyPrefix, isValidBsn };
