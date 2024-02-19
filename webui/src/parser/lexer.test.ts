import { describe, expect, test } from 'vitest';
import { lexString } from "./lexer";

describe('lex single values', () => {
    test.each([
        ['1',             'number',   '1'],
        ['  1  ',         'number',   '1'],
        ['123456789',     'number',   '123456789'],
        ['a',             'ident',    'a'],
        ['__i__d__',      'ident',    '__i__d__'],
        ['id1234',        'ident',    'id1234'],
        ['+',             'operator', '+'],
        ['>=',            'operator', '>='],
        ['>',             'operator', '>'],
        ['(',             'symbol',   '('],
        ['function',      'keyword',  'function'],
        ['""',            'string',   ''],
        ["''",            'string',   ''],
        ["'hello world'", 'string',   'hello world'],
        //["'hello\\\"world'",'string', 'hello\" world'],
        //['123.456', 'number', '123.456']
        //['.456', 'number', '.456']
    ])('lex value "%s" to kind "%s" text "%s"', (input, kind, output) => {
        expect(lexString(input)).toStrictEqual([{kind, text: output}]);
    });
});
