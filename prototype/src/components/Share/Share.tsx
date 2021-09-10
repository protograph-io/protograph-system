import { saveAs } from 'file-saver';
import JSZip from "jszip";
import React, { useContext, useEffect, useState } from "react";
import Clipboard from 'react-clipboard.js';
import RecordRTC from "recordrtc";
import { InterfaceContext } from "../../context/InterfaceProvider";
import { Grammar } from "protograph/lib/grammar/grammar.types";
import { Recorder } from "../../renderer/player";
import { CytoscapeInstance, GraphManagerPlayer } from "protograph/lib/renderer/renderer";
import { Modal } from "../Modal";
import filmIcon from "./images/film-outline.svg";
import imageIcon from "./images/image-outline.svg";
import imagesIcon from "./images/images-outline.svg";





const record = (directives: Grammar.Animation, videoGraph: GraphManagerPlayer, settings: RecordRTC.Options, onDone?: Function) => {
    videoGraph.enact(directives, () => { }, 0, false);
    (videoGraph.player as Recorder).record(settings, () => {
        console.log("DOWNLOAD DONE");
        onDone && onDone();
    });
}
const downloadFrames = (frames: string[], onDone?: Function) => {
    // TODO: Change to support options: png/jpg and minimal frames or full render
    var zip = new JSZip();
    for (let [index, image] of Array.from(frames.entries())) {
        // https://stackoverflow.com/questions/22172604/convert-image-url-to-base64
        let data = image.replace(/^data:image\/(png|jpg);base64,/, "");
        zip.file(`frame-${index}.png`, data, { base64: true });
    }
    zip.generateAsync({ type: "blob" })
        .then(function (content) {
            // see FileSaver.js
            saveAs(content, "protograph-keyframes.zip");
            onDone && onDone();
        });
}
// https://stackoverflow.com/questions/16245767/creating-a-blob-from-a-base64-string-in-javascript
const base64ToBlob = (b64Data: string, contentType = '', sliceSize = 512) => {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];

    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
        const slice = byteCharacters.slice(offset, offset + sliceSize);

        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
            byteNumbers[i] = slice.charCodeAt(i);
        }

        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
    }

    const blob = new Blob(byteArrays, { type: contentType });
    return blob;
}
//   https://stackoverflow.com/questions/39168928/cytoscape-save-graph-as-image-by-button
export const snapshot = (cy: CytoscapeInstance | undefined) => {
    if (!cy) throw Error("No active Cytoscape instance");
    var b64 = cy?.png().replace(/^data:image\/(png|jpg);base64,/, "");
    var imgBlob = base64ToBlob(b64, 'image/png');
    saveAs(imgBlob, 'graph.png');
}




// TODO: add embed iframe, embed code
type TemplateObj = { condition: boolean, image: string, name: string, handler: Function };

type template = { data: TemplateObj, onClick?: React.HTMLAttributes<HTMLDivElement>["onClick"] };
export const ShareOption: React.FC<template> = ({ data, onClick }) => {
    return <div onClick={onClick} className="share">
        <img src={data.image} alt="" className="share_image" />
        <p className="share_name">{data.name}</p>
    </div>
}
type ConfigOption = { label: string, key: string, default: boolean };
export const ShareOptionEmbed: React.FC = () => {
    const [copyText, setCopyText] = useState("Copy");

    useEffect(() => {
        if (copyText !== "Copy") {
            // console.log("SCHEDULING RESETTING COPY TEXT");
            window.setTimeout(() => {
                // console.log("RESETTING COPY TEXT");
                setCopyText("Copy")
            }, 2000)
        }
    }, [copyText]);
    const copySuccess = () => {
        // console.log("COPIED");
        setCopyText("Copied!");
    }

    const options: ConfigOption[] = [
        { label: "Editor", key: "editor", default: false },
        { label: "Controls", key: "playback", default: false },
        { label: "Frames", key: "frames", default: false },
        { label: "Toolbar", key: "toolbar", default: false },
    ]
    const [optionsValues, setOptionsValues] = useState<Record<ConfigOption["key"], boolean>>(Object.fromEntries(options.map(item => ([item.key, item.default]))));
    const optionsHandler = ({ key }: ConfigOption) => {
        setOptionsValues(options => {
            options[key] = (!!options[key]) ? false : true;
            return { ...options };
        })
    }

    // URL // https://usefulangle.com/post/81/javascript-change-url-parameters
    var url = new URL(window.location.href);
    var search_params = url.searchParams;
    search_params.set("embed", true.toString());
    Object.entries(optionsValues).forEach(([key, val]) => {
        search_params.set(key, val.toString());
    })
    url.search = search_params.toString();
    var new_url = url.toString();

    const shareLink = `<iframe width="500" height="500" src="${new_url}" title="ProtoGraph" frameborder="0"></iframe>`;

    return <div className="share">
        <div className="embed-options">
            {
                options.map(opt => <label htmlFor={opt.key} key={opt.key} className="container" onClick={() => optionsHandler(opt)}>
                    <input id={opt.key} checked={!!optionsValues[opt.key]} type="checkbox" onChange={() => optionsHandler(opt)} />
                    <span className="label_inner">{opt.label}</span>
                    <span className="checkmark"></span>
                </label>)
            }
        </div>
        <div className="url_wrapper embed">
            <input disabled value={shareLink} className="url_inner" id="copy-embed-link"></input>
            <Clipboard data-clipboard-text={shareLink} className="url_copy button" onSuccess={copySuccess}>{copyText}</Clipboard>
        </div>
        <p className="share_name">Embed</p>
    </div>
}


export const Share: React.FC<{ onClose: () => void }> = ({ onClose }) => {
    const { videoGraph, lastDirectives, frames, cy } = useContext(InterfaceContext);
    const recorder = videoGraph.player as Recorder;
    const [isRecording, setIsRecording] = useState(false);
    const [isPreparingFrames, setIsPreparingFrames] = useState(false);

    const startDownloadFrames = () => {
        if (isPreparingFrames) return;
        setIsPreparingFrames(true)
        downloadFrames(frames, () => setIsPreparingFrames(false))
    }
    const startRecord = () => {
        if (isRecording) return;
        setIsRecording(true)
        record(lastDirectives, videoGraph, recorder.defaultConfigs["webm"], () => setIsRecording(false));
    }

    const templates: TemplateObj[] = [
        {
            condition: true,
            name: "Download Current Frame",
            image: imageIcon,
            handler: () => snapshot(cy)
        },
        {
            condition: !!frames && !!frames.length,
            name: (!isPreparingFrames) ? "Download Snapshots of Frames" : "Loading...",
            image: imagesIcon,
            handler: () => startDownloadFrames()
        },
        {
            condition: !!frames && frames.length > 1,
            name: (!isRecording) ? "Download WebM Video" : "Loading...",
            image: filmIcon,
            handler: () => startRecord()
        },
    ];

    const [copyText, setCopyText] = useState("Copy");

    useEffect(() => {
        if (copyText !== "Copy") {
            console.log("SCHEDULING RESETTING COPY TEXT");
            window.setTimeout(() => {
                console.log("RESETTING COPY TEXT");
                setCopyText("Copy")
            }, 2000)
        }
    }, [copyText]);
    const copySuccess = () => {
        console.log("COPIED");
        setCopyText("Copied!");
    }

    const shareLink = window.location.href;
    return <Modal className="share-modal" onBackdropClick={() => onClose()}>
        {/* <div className="close">
            <HamburgerMenu
                isOpen={true}
                menuClicked={onClose}
                width={18}
                height={12}
                strokeWidth={2}
                rotate={0}
                color='black'
                borderRadius={2}
                animationDuration={0.5}
            />
        </div> */}
        <div className="header">
            <h1 className="title">Share</h1>
            <div className="url_wrapper">
                <input value={shareLink} disabled className="url_inner" id="copy-share-link"></input>
                <Clipboard data-clipboard-text={shareLink} className="url_copy button" onSuccess={copySuccess}>{copyText}</Clipboard>
            </div>
        </div>
        <div className="share-options">
            {
                templates.filter(item => item.condition).map(item => <ShareOption key={item.name} data={item} onClick={() => item.handler()}></ShareOption>)
            }
            <ShareOptionEmbed></ShareOptionEmbed>
        </div>
    </Modal>
}
