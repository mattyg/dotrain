import { RainDocument } from "../parser/rainParser";
import { MarkupKind } from "vscode-languageserver-types";
import { RDNode } from "../../shared/parser/rainParserTypes";
import { LanguageServiceParams, TextDocument, Position, Hover, Range } from "../../shared/rainLanguageTypes";


/**
 * @public Provides hover items
 * 
 * @param document - The TextDocuemnt
 * @param position - Position of the textDocument to get the completion items for
 * @param opmeta - The op meta
 * @param setting - (optional) Language service params
 * @returns Promise of hover item and null if no item was available for that position
 */
export function getRainHover(
    document: TextDocument,
    position: Position,
    opmeta: Uint8Array | string,
    setting?: LanguageServiceParams
): Hover | null

/**
 * @public Provides hover items
 * 
 * @param document - The RainDocument object instance
 * @param position - Position of the textDocument to get the completion items for
 * @param setting - (optional) Language service params
 * @returns Promise of hover item and null if no item was available for that position
 */
export function getRainHover(
    document: RainDocument,
    position: Position,
    setting?: LanguageServiceParams
): Hover | null

export function getRainHover(
    document: RainDocument | TextDocument,
    position: Position,
    settingOrOpemta?: Uint8Array | string | LanguageServiceParams,
    setting?: LanguageServiceParams 
): Hover | null {
    let _contentType: MarkupKind = "plaintext";
    let _setting: LanguageServiceParams | undefined;
    let _rd: RainDocument;
    let _td: TextDocument;
    if (document instanceof RainDocument) {
        _rd = document;
        _td = _rd.getTextDocument();
        if (settingOrOpemta) _setting = settingOrOpemta as LanguageServiceParams;
    }
    else {
        _rd = new RainDocument(document, settingOrOpemta as Uint8Array | string);
        _td = document;
        if (setting) _setting = setting;
    }
    const format = _setting
        ?.clientCapabilities
        ?.textDocument
        ?.completion
        ?.completionItem
        ?.documentationFormat;
    if (format && format[0]) _contentType = format[0];

    const _offset = _td.offsetAt(position);
    const _tree = _rd.getParseTree().find(v =>
        v.position[0] <= _offset && v.position[1] >= _offset
    );
    const search = (node: RDNode[]): Hover | null => {
        for (let i = 0; i < node.length; i++) {
            const _n = node[i];
            if (_n.position[0] <= _offset && _n.position[1] >= _offset) {
                if ("opcode" in _n) {
                    if (_n.parens[0] < _offset && _n.parens[1] > _offset) {
                        return search(_n.parameters);
                    }
                    else return {
                        contents: {
                            kind: _contentType,
                            value: _n.opcode.description
                        }
                    } as Hover;
                }
                else if ("value" in _n) {
                    return {
                        contents: {
                            kind: _contentType,
                            value: "Value"
                        }
                    } as Hover;
                }
                else return {
                    contents: {
                        kind: _contentType,
                        value: _contentType === "markdown"
                            ? [
                                "LHS Alias",
                                "```rainlang",
                                _td.getText(
                                    Range.create(
                                        _td.positionAt(_n.position[0]), 
                                        _td.positionAt(_n.position[1] + 1)
                                    )
                                ),
                                "```"
                            ].join("\n")
                            : `LHS Alias to: ${
                                _td.getText(Range.create(
                                    _td.positionAt(_n.position[0]), 
                                    _td.positionAt(_n.position[1] + 1)
                                ))
                            }`
                    },
                    range: Range.create(_td.positionAt(4), _td.positionAt(12))
                } as Hover;
            }
            else if (_n.lhs) {
                let _lhs = _n.lhs;
                if (!Array.isArray(_lhs)) _lhs = [_lhs];
                for (let j = 0; j < _lhs.length; j++) {
                    if (_lhs[j].position[0] <= _offset && _lhs[j].position[1] >= _offset) {
                        return {
                            contents: {
                                kind: _contentType,
                                value: "opcode" in _n 
                                    ? _contentType === "markdown"
                                        ? [
                                            "Alias for", 
                                            "```rainlang",
                                            _td.getText(
                                                Range.create(
                                                    _td.positionAt(_n.position[0]),
                                                    _td.positionAt(_n.position[1] + 1)
                                                )
                                            ),
                                            "```"
                                        ].join("\n")
                                        : `Alias for: ${
                                            _td.getText(Range.create(
                                                _td.positionAt(_n.position[0]),
                                                _td.positionAt(_n.position[1] + 1)
                                            ))
                                        }`
                                    : "value" in _n
                                        ? _contentType === "markdown"
                                            ? [
                                                "Alias for value",
                                                "```rainlang",
                                                _n.value,
                                                "```"
                                            ].join("\n")
                                            : `Alias for value: ${
                                                _n.value
                                            }`
                                        : _contentType === "markdown"
                                            ? [
                                                "Alias for alias",
                                                "```rainlang",
                                                _n.name,
                                                "```"
                                            ].join("\n")
                                            : `Alias for alias: ${
                                                _n.name
                                            }`
                            }
                        } as Hover;
                    }
                }
            }
        }
        return null;
    };
    if (_tree) {
        try {
            return search(_tree.tree);
        }
        catch (err) {
            console.log(err);
            return null;
        }
    }
    else return null;
}
