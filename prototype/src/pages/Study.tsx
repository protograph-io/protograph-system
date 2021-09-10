import { createClient } from '@supabase/supabase-js';
import { differenceInSeconds, parseISO } from 'date-fns';
import { debounce } from 'protograph/lib/core/helpers';
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ActiveTraining from "./ActiveTraining/ActiveTraining";
import BuildYourOwn from "./BuildYourOwn/BuildYourOwn";
import CodeToSketch from "./CodeToSketch/CodeToSketch";
import CodeToSketchActiveTraining from "./CodeToSketchActiveTraining/CodeToSketchActiveTraining";
import SketchToCode from "./SketchToCode/SketchToCode";
import { StudyConclusion } from './StudyConclusion';
import { StudyConsent } from './StudyConsent';
import { StudyWelcome } from "./StudyWelcome";
import Trials from "./Trials/Trials";
const url = require('url-parameters').default;

// Create a single supabase client for interacting with your database
export const supabaseBackup = createClient('https://inspirerd.dev', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTYwMzk2ODgzNCwiZXhwIjoyNTUwNjUzNjM0LCJhdWQiOiIiLCJzdWIiOiIiLCJyb2xlIjoiYW5vbiJ9.jKsLhQ4SoUoOeC4IyDxPzvotqCKz77kdQ49WRzyP0kw');
export const supabase = createClient('https://ozfxxdvqaykhwqfijquv.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYyODYyMzAzNiwiZXhwIjoxOTQ0MTk5MDM2fQ.oflNBVNbicBxSw7so7MylnaevQQ1nbu8tkEEoVcoBz8');
export const BACKUP_ENABLED = true;


function getWidth() {
    return Math.max(
        document.body.scrollWidth,
        document.documentElement.scrollWidth,
        document.body.offsetWidth,
        document.documentElement.offsetWidth,
        document.documentElement.clientWidth
    );
}

function getHeight() {
    return Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
        document.body.offsetHeight,
        document.documentElement.offsetHeight,
        document.documentElement.clientHeight
    );
}


function pad(num: number | string, size: number) {
    num = num.toString();
    while (num.length < size) num = "0" + num;
    return num;
}
const debouncedSaveEventsCounted = (prefix: string | null = null) => {
    let count = 1;
    let eventsStore: any[] = [];
    const sendNoWait = (row_id: string, backup_row_id: string | null) => {
        if (!eventsStore.length) return;
        const partition = count;
        count += 1;
        const events = [...eventsStore];
        eventsStore.length = 0;
        eventsStore = [];

        if (backup_row_id !== undefined && backup_row_id !== null) {
            // console.log("backup", backup_row_id, partition, events.length, events)
            if (BACKUP_ENABLED) supabaseBackup.from("study_entries_events_all").insert({
                study_id: backup_row_id,
                events,
                partition,
                prefix,
            }, {
                returning: "minimal"
            }).then(({ data, error }) => {
                // console.log("db saving events database result", data, error)
                if (error) console.error("survey backup events reporting error", error);
            })

        }
        if (row_id !== undefined) {
            return supabase.storage
                .from('events')
                // .upload(`public/${row_id}${prefix ? `-prefix-${prefix}` : '-no-prefix'}-chunk-${pad(partition, 8)}.json`, JSON.stringify(events), {
                .upload(`public/${row_id}/${prefix ? `${prefix}` : 'no-prefix'}/${pad(partition, 8)}.json`, JSON.stringify(events), {
                    // cacheControl: 3600,
                    upsert: true,
                }).then(({ data, error }) => {
                    if (error) console.error("survey events reporting error", error);
                })
        }
    };
    const send = debounce((row_id: string, backup_row_id: string | null) => {
        sendNoWait(row_id, backup_row_id);
    }, 8000);
    return {
        report: (event: any, row_id: string, backup_row_id: string | null) => {
            eventsStore.push(event); // more performant than concat
            if (eventsStore.length > 700) sendNoWait(row_id, backup_row_id)
            else send(row_id, backup_row_id);
        },
        send: sendNoWait
    }
}

export const DocsReportingContext = React.createContext({
    enabled: false,
    study_id: null as null | string,
    backup_study_id: null as null | string,
    location: null as null | string
})
const DocsReportingProvider: React.FC<{ study_id: string | null, backup_study_id: string | null, location: string }> = ({ children, study_id, backup_study_id, location }) => {
    return <DocsReportingContext.Provider value={{
        enabled: true,
        study_id,
        location,
        backup_study_id
    }}>
        {children}
    </DocsReportingContext.Provider>
}



const pagesStatic = [
    {
        key: "welcome",
        // render: <StudyWelcome onNext={next}></StudyWelcome>,
    },
    {
        key: "active-training",
        // render: <ActiveTraining onNext={next}></ActiveTraining>,
    },
    {
        key: "trial",
        // render: <Trials onNext={next}></Trials>,
    },
    {
        key: "sketch-to-code",
        // render: <SketchToCode onNext={next}></SketchToCode>,
    },
    {
        key: "code-to-sketch-training",
        // render: <CodeToSketchActiveTraining onNext={next}></CodeToSketchActiveTraining>,
    },
    {
        key: "code-to-sketch",
        // render: <CodeToSketch onNext={next}></CodeToSketch>,
    },
    {
        key: "build-your-own",
        // render: <BuildYourOwn></BuildYourOwn>
    }
    // TODO: Update
    // <PrototypeTool></PrototypeTool>
];


const redirectOut = (prolificId: string | null) => {
    if (!!prolificId) {
        // window.location.href = 'https://app.prolific.co/submissions/complete?cc=22ED3120';
        window.location.href = 'https://app.prolific.co/submissions/complete?cc=668304FB';
    } else {
        window.location.href = 'https://protograph.io/';
    }
}
const Study: React.FC = () => {
    const [state, setState] = useState<number>(0);


    const survey_id = useRef<string | null>(null);
    const [surveyIdState, setSurveyIdState] = useState<string | null>(null);
    const backup_survey_id = useRef<string | null>(null);
    const [backupSurveyIdState, setBackupSurveyIdState] = useState<string | null>(null);
    const recordStop = useRef<any>(null);
    const recordReport = useRef<ReturnType<typeof debouncedSaveEventsCounted> | null>(null);
    const [prolificId, setProlificId] = useState<string | null>(null);

    const startDate = useMemo(() => (new Date()).toISOString(), []);
    const onStudyComplete = () => {
        const endDate = (new Date()).toISOString();
        const data = {
            start_at: startDate,
            end_at: endDate,
            duration: differenceInSeconds(parseISO(endDate), parseISO(startDate)),
        };
        if (survey_id.current !== undefined || backup_survey_id.current !== undefined) {
            Promise.all([
                supabase.from("study_entries").update({
                    ...data
                }, {
                    returning: "minimal"
                }).eq("id", survey_id.current).then(({ data, error }) => {
                    // console.log("db saving complete time database result", data, error)
                    console.log("db saving complete time database result")
                }),
                ...((BACKUP_ENABLED) ? [supabaseBackup.from("study_entries").update({
                    ...data
                }, {
                    returning: "minimal"
                }).eq("id", backup_survey_id.current).then(({ data, error }) => {
                    // console.log("db saving complete time database result", data, error)
                    console.log("db saving complete time database result")
                })] : [])
            ]).finally(() => {
                if (recordReport.current && survey_id.current) {
                    const res = recordReport.current.send(survey_id.current, backup_survey_id.current);
                    recordStop.current();
                    if (res) res.finally(() => redirectOut(prolificId))
                    else redirectOut(prolificId);;
                } else {
                    redirectOut(prolificId)
                }
                recordReport.current = null;
            })
        }
    }


    useEffect(() => {
        // Init
        const prolific_pid = url.get("PROLIFIC_PID");
        setProlificId(prolific_pid);
        // console.log("db insert begin", prolific_pid);
        supabase.from("study_entries").insert({
            "prolific_pid": prolific_pid || null,
            browser_width: getWidth(),
            browser_height: getHeight(),
            study_version: 2,
            events: []
        }).then(({ data, error }) => {
            // console.log("db insert", data, error);
            if (!error && data && data.length && data[0].id) {
                const id = data[0].id;;
                survey_id.current = id;
                setSurveyIdState(id);
                // console.log("survey insert created", id);
            }
            if (error) console.error("survey insert error", error);
        });
        if (BACKUP_ENABLED) supabaseBackup.from("study_entries").insert({
            "prolific_pid": prolific_pid || null,
            browser_width: getWidth(),
            browser_height: getHeight(),
            study_version: 2,
            events: []
        }).then(({ data, error }) => {
            // console.log("db insert", data, error);
            if (!error && data && data.length && data[0].id) {
                const id = data[0].id;;
                backup_survey_id.current = id;
                setBackupSurveyIdState(id);
                // console.log("survey backup insert created", id);
            }
            if (error) console.error("survey insert error", error);
        });


    }, []);


    const next = useCallback(() => {
        if (!survey_id.current) return;
        setState(t => {
            return t + 1;
        });
    }, []);

    const pages = [
        {
            key: "welcome",
            render: <StudyConsent prolificId={prolificId} onNext={next}></StudyConsent>,
        },
        {
            key: "welcome",
            render: <StudyWelcome onNext={next}></StudyWelcome>,
        },
        {
            key: "active-training",
            render: <ActiveTraining onNext={next}></ActiveTraining>,
        },
        {
            key: "trial",
            render: <Trials onNext={next} onBack={() => setState(t => t - 1)}></Trials>,
        },
        {
            key: "sketch-to-code",
            render: <SketchToCode onNext={next}></SketchToCode>,
        },
        {
            key: "code-to-sketch-training",
            render: <CodeToSketchActiveTraining onNext={next}></CodeToSketchActiveTraining>,
        },
        {
            key: "code-to-sketch",
            render: <CodeToSketch onNext={next}></CodeToSketch>,
        },
        {
            key: "build-your-own",
            render: <BuildYourOwn onNext={next}></BuildYourOwn>
        }
        // TODO: Update
        // <PrototypeTool></PrototypeTool>
    ];

    return <DocsReportingProvider study_id={surveyIdState} backup_study_id={backupSurveyIdState} location={`${state + 1}: ${pages[state] ? pages[state].key : "undefined"}`}>
        {
            (state >= 0 && state < pages.length) ? pages[state].render : <StudyConclusion prolificId={prolificId} onSuccess={onStudyComplete}></StudyConclusion>
        }
    </DocsReportingProvider>
};

export default Study;