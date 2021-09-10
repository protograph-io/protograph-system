import { useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { record } from "rrweb";
import { InterfaceContext } from "./context/InterfaceProvider";
import { debounce } from "./core/helpers";
import { DocsReportingContext, supabase } from "./pages/Study";

export function pad(num: number | string, size: number) {
    num = num.toString();
    while (num.length < size) num = "0" + num;
    return num;
}
export const debouncedSaveEventsForSection = (prefix: string | null = null) => {
    let count = 1;
    let eventsStore: any[] = [];
    const sendNoWait = (row_id: string) => {
        if (!eventsStore.length) return;
        const partition = count;
        count += 1;
        const events = [...eventsStore];
        eventsStore.length = 0;
        eventsStore = [];

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
    const send = debounce((row_id: string) => {
        sendNoWait(row_id);
    }, 8000);
    return {
        report: (event: any, row_id: string) => {
            eventsStore.push(event); // more performant than concat
            if (eventsStore.length > 700) sendNoWait(row_id)
            else send(row_id);
        },
        send: sendNoWait
    }
}

export const useRecordedSection = (sectionName: string, onNext?: () => void, waitForCy: boolean = true) => {
    const { cy } = useContext(InterfaceContext);
    const debouncedSaveEvents = useMemo(() => debouncedSaveEventsForSection(sectionName), [sectionName]);
    const recordStop = useRef<any>(null);
    const { study_id } = useContext(DocsReportingContext);
    useEffect(() => {
        if (!study_id || !debouncedSaveEvents || (waitForCy && !cy)) return;

        // recordReport.current = debouncedSaveEvents;
        if (!recordStop.current) recordStop.current = record({
            // recordCanvas: true,
            // packFn: pack,
            emit(event) {
                // store the event in any way you like
                // events.current.push(event);
                // currentStageEvents.current.push(event);
                if (study_id) debouncedSaveEvents.report(event, study_id)
            },
        });
        return () => {
            if (study_id) debouncedSaveEvents.send(study_id);
            recordStop.current && recordStop.current();
            recordStop.current = null;
        }
    }, [study_id, debouncedSaveEvents, cy, waitForCy]);

    const stop = useCallback(() => {
        debouncedSaveEvents && study_id && debouncedSaveEvents.send(study_id);
        recordStop.current && recordStop.current();
        recordStop.current = null;
    }, [debouncedSaveEvents, study_id]);

    const onNextHandler = useCallback(() => {
        stop();
        onNext && onNext();
    }, [onNext, stop]);

    return { stop, onNextHandler };
}