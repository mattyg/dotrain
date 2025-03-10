import { RainDocument } from "../parser/rainDocument";
import { Range, ErrorCode, Diagnostic, TextDocument, DiagnosticSeverity, LanguageServiceParams } from "../languageTypes";


/**
 * @public Provides diagnostics
 * 
 * @param document - The TextDocument
 * @param setting - (optional) Language service params
 * @returns A promise that resolves with diagnostics
 */
export async function getDiagnostics(
    document: TextDocument, 
    setting?: LanguageServiceParams
): Promise<Diagnostic[]>

/**
 * @public Provides diagnostics
 * 
 * @param document - The RainDocument
 * @param setting - (optional) Language service params
 * @returns A promise that resolves with diagnostics
 */
export async function getDiagnostics(
    document: RainDocument,
    setting?: LanguageServiceParams
): Promise<Diagnostic[]>

export async function getDiagnostics(
    document: RainDocument | TextDocument, 
    setting?: LanguageServiceParams 
): Promise<Diagnostic[]> {
    let _hasRelatedInformation = false;
    let _rd: RainDocument;
    let _td: TextDocument;
    if (document instanceof RainDocument) {
        _rd = document;
        _td = _rd.textDocument;
        if (setting?.metaStore && _rd.metaStore !== setting.metaStore) {
            _rd.metaStore.update(setting.metaStore);
            await _rd.parse();
        }
    }
    else {
        _td = document;
        _rd = await RainDocument.create(document, setting?.metaStore);
    }
    const option = setting
        ?.clientCapabilities
        ?.textDocument
        ?.publishDiagnostics
        ?.relatedInformation;
    if (option !== undefined) _hasRelatedInformation = option;

    if (_hasRelatedInformation) return Promise.resolve(
        _rd.getAllProblems().map(v => Diagnostic.create(
            Range.create(
                _td.positionAt(v.position[0]),
                _td.positionAt(v.position[1] + 1)
            ),
            ErrorCode[v.code].replace(/[A-Z]+/g, (v, i) => {
                if (i === 0) return v;
                else return ` ${v}`;
            }),
            DiagnosticSeverity.Error,
            v.code,
            "rainlang",
            [
                {
                    location: {
                        uri: _td.uri,
                        range: Range.create(
                            _td.positionAt(v.position[0]),
                            _td.positionAt(v.position[1] + 1)
                        )
                    },
                    message: v.msg
                }
            ]
        ))
    );
    else return Promise.resolve(
        _rd.getAllProblems().map(v => Diagnostic.create(
            Range.create(
                _td.positionAt(v.position[0]),
                _td.positionAt(v.position[1] + 1)
            ),
            v.msg,
            DiagnosticSeverity.Error,
            v.code,
            "rainlang"
        ))
    ); 
}
