import { useContext } from "react";
import HamburgerMenu from "react-hamburger-menu";
import { InterfaceContext } from "../context/InterfaceProvider";
import align from "../examples/align";
import alignImage from "../examples/align.png";
import binaryTree from "../examples/binary-tree";
import binaryTreeImage from "../examples/binary-tree.png";
import blank from "../examples/blank";
import blankImage from "../examples/blank.png";
import fattree from "../examples/fattree";
import fattreeImage from "../examples/fattree.png";
import fullyConnected from "../examples/fully-connected";
import fullyConnectedImage from "../examples/fully-connected.png";
import layeredNetwork from "../examples/layered-network";
import layeredNetworkImage from "../examples/layered-network.png";
import { Modal } from "./Modal";

type TemplateObj = { image: string, name: string, code: string };

const templates: TemplateObj[] = [
    { name: "Blank", image: blankImage, code: blank },
    { name: "Binary Tree", image: binaryTreeImage, code: binaryTree },
    { name: "Fully Connected", image: fullyConnectedImage, code: fullyConnected },
    { name: "Align", image: alignImage, code: align },
    { name: "Layered Network", image: layeredNetworkImage, code: layeredNetwork },
    { name: "Fat-Tree", image: fattreeImage, code: fattree },
    // { name: "MLP", image: "#", code: "" },
];

type template = { data: TemplateObj, onClick: React.HTMLAttributes<HTMLDivElement>["onClick"] };
export const Template: React.FC<template> = ({ data, onClick }) => {
    return <div onClick={onClick} className="template">
        <img src={data.image} alt="" className="template_image" />
        <p className="template_name">{data.name}</p>
    </div>
}


export const Welcome: React.FC<{ onSelect: (input: string) => void, onClose: () => void }> = ({ onSelect, onClose }) => {
    const { setOverrideCode } = useContext(InterfaceContext)
    return <Modal className="welcome-modal" onBackdropClick={() => onClose()}>
        <div className="close">
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
        </div>
        <div className="header">
            <h1 className="title">Welcome to ProtoGraph!</h1>
            <p className="intro">ProtoGraph is a tool for easily creating graph visualizations. Choose a template or start with a blank document.</p>
        </div>
        <div className="template-gallery">
            {
                templates.map(temp => <Template key={temp.name} onClick={() => {
                    setOverrideCode(temp.code)
                    onSelect(temp.code);
                }} data={temp}></Template>)
            }
        </div>
    </Modal>
}
