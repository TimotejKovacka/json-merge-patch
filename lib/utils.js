'use strict';

exports.serialize = function serialize(value) {
  if (value === undefined) {
    return {};
  }

  if (value && typeof value.toJSON === 'function') {
    return value.toJSON();
  }

  return value;
};
