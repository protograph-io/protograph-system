export declare namespace Grammar {
    type Location = {
        "start": {
            "offset": number;
            "line": number;
            "column": number;
        };
        "end": {
            "offset": number;
            "line": number;
            "column": number;
        };
    };
    type Line = Command | Object | QueryLine;
    type SingleParameter = Line | Plain | string | number;
    type Parameters = SingleParameter[];
    type NamedParameters = Record<string, SingleParameter>;
    type Properties = Record<string, string>;
    interface PEGjsRuleReturnValue {
        type: string;
        keyword: string;
        parameters: Parameters;
        named_parameters?: NamedParameters;
        "location": Location;
        raw: string;
    }
    interface Object extends PEGjsRuleReturnValue {
        type: "object";
        properties: Properties;
        returnAutoComplete?: boolean;
    }
    type Plain = Record<string, any> & {
        type: "plain";
    };
    interface Command extends PEGjsRuleReturnValue {
        type: "command";
        returnAutoComplete?: boolean;
        properties: Properties;
    }
    type QueryLine = Query & {
        properties?: Properties;
    };
    interface Query extends PEGjsRuleReturnValue {
        type: "query";
        returnAutoComplete?: boolean;
    }
    type Keyframe = Line[];
    type Animation = {
        data: Keyframe;
        location: Location;
        raw: string;
        newlines: {
            index: number;
            raw: string;
        }[];
    }[];
}
