import { differenceInSeconds, parseISO } from 'date-fns';
import React, { useCallback, useContext, useMemo, useState } from 'react';
import { DocsViewProvider } from '../components/Docs/DocsContext';
import { FullScreenMenu } from '../components/Toolbar';
import { setState } from '../context/InterfaceProvider';
import { BACKUP_ENABLED, DocsReportingContext, supabase, supabaseBackup } from './Study';

export const ViewContext = React.createContext<{
    isMobileMenuOpen: boolean;
    setIsMobileMenuOpen: setState<boolean>
}>({
    isMobileMenuOpen: false,
    setIsMobileMenuOpen: () => undefined
});
export const ViewProvider: React.FC = ({ children }) => {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false)
    const providerValue = {
        isMobileMenuOpen,
        setIsMobileMenuOpen
    }
    return (<ViewContext.Provider value={providerValue}> {children} </ViewContext.Provider>)
}
const StudyToolbar: React.FC<{ onNext: () => void, progressText: string, buttonText: string }> = ({ onNext, progressText, buttonText = "Submit Text" }) => {
    const { setIsMobileMenuOpen, isMobileMenuOpen } = useContext(ViewContext);
    return <>
        <FullScreenMenu open={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)}>
            <li ><div className="button button--clear">{progressText}</div></li>
            <li onClick={onNext}><div className="share button">{buttonText}</div></li>
        </FullScreenMenu>
        <div className="toolbar">
            <div className="left">
                <h1 className="brand">ProtoGraph</h1>
                <div className="button button--clear hide-on-mobile-inline-block">{progressText}</div>
            </div>
            {/* <div className="right">
                <div className="share button hide-on-mobile-inline-block next-task-button" onClick={onNext}>{buttonText}</div>
            </div> */}
        </div>
    </>
}


// Default is 1-7
type LikertOption = ({ label: string, value: any }[]) | string[] | number[];
const LikertRadio: React.FC<{ options?: LikertOption, name: string, left?: string, right?: string, values: FormValues, setValues: setState<FormValues> }> = ({ name, left, right, values, setValues, options = (new Array(7)).fill(1).map((_, i) => i + 1) }) => {
    return <div className="likert">
        {left && <div className="bound left">{left}</div>}
        {/* <div className="inputs"> */}
        {
            options.map((item, index) => {
                const label = (typeof item === "string" || typeof item === "number") ? item : item.label;
                const val = (typeof item === "string" || typeof item === "number") ? index + 1 : item.value;
                return <label key={`input-${name}-${val}`}>
                    <span>{label}</span>
                    <input
                        name={name}
                        type="radio"
                        value={val}
                        checked={values[name] === val}
                        onChange={(e) => setValues(v => ({ ...v, [name]: val }))}
                    />
                </label>
            })
        }
        {/* </div> */}
        {right && <div className="bound right">{right}</div>}
    </div>
}
const LikertTextarea: React.FC<{ options?: LikertOption, name: string, left?: string, right?: string, values: FormValues, setValues: setState<FormValues> }> = ({ name, left, right, values, setValues, options = (new Array(7)).fill(1).map((_, i) => i + 1) }) => {
    const textareaName = `${name}_explanation`;
    return <textarea
        name={textareaName}
        value={values[textareaName] || ""}
        onChange={(e) => setValues(v => ({ ...v, [textareaName]: e.target.value }))}
        rows={4}
        className="likert-group_explain"
    ></textarea>
}
const Likert: React.FC<{ options?: LikertOption, name: string, prompt: string, left?: string, right?: string, explain?: boolean, values: FormValues, setValues: setState<FormValues> }> = ({ name, options, prompt, left, right, explain = false, values, setValues }) => {
    return <div className="likert-group">
        <div className="likert-group_prompt">{prompt}</div>
        <LikertRadio name={name} options={options} left={left} right={right} values={values} setValues={setValues}></LikertRadio>
        {

            explain && <>
                <div className="explain-prompt">Please explain your rating here.</div><LikertTextarea name={name} options={options} left={left} right={right} values={values} setValues={setValues}></LikertTextarea>
            </>
        }
    </div>
}



type FormValues = Record<string, string | number | null>;
export const useReporting = (data: FormValues, onSuccess: () => void) => {
    const [errorButtonText, setErrorButtonText] = useState<null | string>(null);
    const { study_id, backup_study_id } = useContext(DocsReportingContext);

    const startDate = useMemo(() => (new Date()).toISOString(), []);
    const confirmNextHandler = useCallback(() => {
        setErrorButtonText("Loading...");
        const endDate = (new Date()).toISOString();

        supabase.from("study_survey_questions").insert({
            study_id,
            start_at: startDate,
            end_at: endDate,
            duration: differenceInSeconds(parseISO(endDate), parseISO(startDate)),
            ...data
            // events: []
        }, {
            returning: "minimal"
        }).then(({ data, error }) => {
            console.log("db insert", data, error);
            if (!error) {
                setErrorButtonText(null);
                onSuccess();
            }
            if (error) {
                console.error("survey insert error", error);
                setErrorButtonText("Error, try again.")
            }
        });
        if (BACKUP_ENABLED) supabaseBackup.from("study_survey_questions").insert({
            study_id: backup_study_id,
            start_at: startDate,
            end_at: endDate,
            duration: differenceInSeconds(parseISO(endDate), parseISO(startDate)),
            ...data
            // events: []
        }, {
            returning: "minimal"
        }).then(({ data, error }) => {
            console.log("db insert", data, error);
            if (!error) {
                // setErrorButtonText(null);
                // onSuccess();
            }
            if (error) {
                console.error("survey backup insert error", error);
                // setErrorButtonText("Error, try again.")
            }
        });
    }, [backup_study_id, data, onSuccess, startDate, study_id]);
    return { confirmNextHandler, errorButtonText };
};

export const StudyConclusion: React.FC<{ prolificId: string | null, onSuccess: () => void; }> = ({ prolificId, onSuccess }) => {

    const [values, setValues] = useState<FormValues>({
        gender: "",
        education: "",
        familiarity: null,
        experience: null,
        usefulness: null,
        usefulness_explanation: "",
        learnability: null,
        learnability_explanation: "",
        readability: null,
        readability_explanation: "",
        usability: null,
        usability_explanation: "",
    });
    console.log("values", values);

    const { confirmNextHandler, errorButtonText } = useReporting(values, onSuccess);

    // Ensure that all non-explanation questions are answered
    const valid = Object.entries(values).filter(([key, _]) => !key.endsWith("_explanation")).map(([_,val]) => val).every(val => !!val);

    let buttonText = (!!prolificId) ? "Submit and Return to Prolific" : "Submit and Exit Study";
    if (!valid) buttonText = "Survey Incomplete"
    if (errorButtonText) buttonText = errorButtonText;



    return <>
        <DocsViewProvider>
            <ViewProvider>
                <StudyToolbar onNext={() => { }} progressText={``} buttonText={``}></StudyToolbar>
                <div style={{ flex: "1 1 auto", minWidth: 0, minHeight: 0, overflow: "auto", display: "flex", justifyContent: "center" }}>
                    <div style={{ flex: '0 1 auto', margin: "auto", minWidth: 0, minHeight: 0, padding: "2rem", maxWidth: "800px", lineHeight: "1.5" }}>
                        <h1>Feedback Survey</h1>
                        <p>Thank you! Before you finish the study, please provide some demographic information as well as general feedback on your experience.</p>
                        <br />
                        {/* Age

                        Gender (Male/Female/Other,Non-binary/Unspecified)

                        Highest Degree Obtained (high school, bachelors, masters, PhD, Other, unspecified)

                        On  a scale of 1 (not familiar) to 7 (very familiar) , how familiar are you with graph visualizations?

                        On  a scale of 1 (no experience) to 7 (experienced coder) , how much coding/programming experience do you have?

                        On  a scale of 1 (not useful) to 7 (very useful) , how useful were the training videos and hands on tour for understanding the Protograph language and how to use it to create graphs?

                        Please explain your rating here.


                        On  a scale of 1 (very difficult) to 7 (very easy) , how easy did you find Protograph to learn and use?

                        Please explain your rating here.

                        Lastly, Please share your overall impressions of Protograph here, including any recommendations for improvement.

                        Thanks for participating in our study! */}
                        <div className="questions">
                            <Likert values={values} setValues={setValues} prompt="Gender:" name="gender" options={[
                                { label: "Male", value: "male" },
                                { label: "Female", value: "female" },
                                { label: "Other/Non-Binary", value: "other" },
                                { label: "Unspecified", value: "unspecified" },
                            ]}></Likert>
                            <Likert values={values} setValues={setValues} prompt="Highest Degree Obtained:" name="education" options={[
                                { label: "High School", value: "1: high-school" },
                                { label: "Bachelors", value: "2: bachelors" },
                                { label: "Masters", value: "3: masters" },
                                { label: "PhD", value: "4: phd" },
                                { label: "Other", value: "0: other" },
                                { label: "Unspecified", value: "0: unspecified" },
                            ]}></Likert>
                            {/* https://www.simplypsychology.org/likert-scale.html */}
                            {/* https://www.simplypsychology.org/likert-scale-examples.jpg */}
                            <Likert values={values} setValues={setValues} prompt="On a scale of 1 (not familiar) to 7 (very familiar), how familiar are you with graph visualizations?"
                                name="familiarity"
                                left="Not Familiar"
                                right="Very Familiar"
                            ></Likert>
                            <Likert values={values} setValues={setValues} prompt="On a scale of 1 (no experience) to 7 (experienced coder), how much coding/programming experience do you have?"
                                name="experience"
                                left="No Experience"
                                right="Experienced Coder"
                            ></Likert>
                            <Likert values={values} setValues={setValues} prompt="On  a scale of 1 (not useful) to 7 (very useful), how useful were the training videos and hands on tour for understanding the Protograph language and how to use it to create graphs?"
                                name="usefulness"
                                left="Not Useful"
                                right="Very Useful"
                                explain
                            ></Likert>
                            <Likert values={values} setValues={setValues} prompt="On a scale of 1 (very difficult) to 7 (very easy), how easy did you find the ProtoGraph language to learn?"
                                name="learnability"
                                left="Very Difficult"
                                right="Very Easy"
                                explain
                            ></Likert>
                            <Likert values={values} setValues={setValues} prompt="On a scale of 1 (very difficult) to 7 (very easy), how easy did you find the ProtoGraph language to read?"
                                name="readability"
                                left="Very Difficult"
                                right="Very Easy"
                                explain
                            ></Likert>
                            <Likert values={values} setValues={setValues} prompt="On a scale of 1 (very difficult) to 7 (very easy), how easy did you find Protograph to use?"
                                name="usability"
                                left="Very Difficult"
                                right="Very Easy"
                                explain
                            ></Likert>
                        </div>


                        <p>Thanks for participating in our study!</p>
                        <button className="share button" disabled={!valid} onClick={() => valid && confirmNextHandler()} style={{opacity: (valid) ? "1" : "0.5"}}>{buttonText}</button>
                        <br />
                        <br />
                    </div>
                </div>
            </ViewProvider>
        </DocsViewProvider>
    </>
}