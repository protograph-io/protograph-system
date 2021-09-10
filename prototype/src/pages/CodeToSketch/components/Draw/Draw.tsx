import classNames from 'classnames/bind';
import React, { useCallback, useState } from 'react';
import { Brush, EllipseOutline, Remove, ReturnUpBackOutline, SquareOutline, Text, Trash } from 'react-ionicons';
import { Tools } from 'react-sketch2';
import './Draw.scss';
import DrawCanvas from './DrawCanvas/DrawCanvas';

// TODO: Add undo/redo
// https://github.com/tbolis/react-sketch/blob/master/examples/main.jsx

type Mode = "drawing" | "text" | "edit" | "rectangle" | "circle" | "line";
type Color = (typeof colors)[number];
type Size = (typeof sizes)[number];
export type setState<status = any> = (status: status | ((status: status) => status)) => unknown;
export interface DrawPanelProps {
  mode: Mode,
  setMode: setState<Mode>;
  onText: (text: string, options?: Partial<{
    fontFamily: string,
    fontSize: number,
    fill: string,
  }>) => void;
  color: Color,
  setColor: (c: Color) => void;
  size: Size,
  setSize: setState<Size>;
  onRemove: () => void;
  onNext: () => void;
  onBack: () => void;
  onUndo: () => void;
}

const sizes = [8, 15, 23, 30];
// const colors = ['#C840E9', '#FF4F9A', '#FF9057', '#FFB930', '#3ACCE1', '#3497FB', '#5873FA', '#FFFFFF', '#000000'];
const colors = ['#D3D3D3', '#FF0100', '#008002', '#1300FF', '#808080', '#000000'];

const DrawPanel: React.FC<DrawPanelProps> = ({ mode, setMode, onText, color, setColor, size, setSize, onRemove, onNext, onBack, onUndo }) => {

  const [textInput, setTextInput] = useState<string>("");
  const textInputKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      console.log('do validate')
      onText(textInput, {
        fontFamily: 'Arial',
        // fontSize: size,
        fontSize: 20,
        fill: color
      })
      setTextInput("");
    }
  }, [color, onText, textInput]);

  return <>
    {
      mode === "text" && <div className="text-tools-input-wrapper">
        <input value={textInput} onChange={(e) => setTextInput(e.target.value!)} onKeyDown={(event) => textInputKeyDown(event)} className="text-tools-input" type="text" placeholder="Your text here... Type enter to add to sketch" style={{ "--font": 'Arial', "--brush-color": color } as any} />
      </div>
    }
    <div className="draw-panel">
      <div className="button-row">
        {/* <ChevronBack onClick={() => onBack()} /> */}
        <ReturnUpBackOutline cssClasses="undo-tool" onClick={() => onUndo()} />
        <svg className="pointer-tool" width="50px" height="50px" viewBox="0 0 35 35" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" style={{ opacity: (mode === 'edit' ? 1 : 0.5) }} onClick={() => setMode('edit')}>
          <defs></defs>
          <g id="Page-1" stroke="none" strokeWidth="1" fill="none" fillRule="evenodd">
            <g id="pointer">
              <g id="bg" fill="#FFFFFF" opacity="0.00999999978">
                <rect x="0" y="0" width="35" height="35"></rect>
              </g>
              <path d="M12,24.4219 L12,8.4069 L23.591,20.0259 L16.81,20.0259 L16.399,20.1499 L12,24.4219 Z" id="point-border" fill="#FFFFFF"></path>
              <path d="M21.0845,25.0962 L17.4795,26.6312 L12.7975,15.5422 L16.4835,13.9892 L21.0845,25.0962 Z" id="stem-border" fill="#FFFFFF"></path>
              <path d="M19.751,24.4155 L17.907,25.1895 L14.807,17.8155 L16.648,17.0405 L19.751,24.4155 Z" id="stem" fill="#000000"></path>
              <path d="M13,10.814 L13,22.002 L15.969,19.136 L16.397,18.997 L21.165,18.997 L13,10.814 Z" id="point" fill="#000000"></path>
            </g>
          </g>
        </svg>
        <Brush cssClasses="brush-tool" onClick={() => setMode('drawing')} style={{ opacity: (mode === 'drawing' ? 1 : 0.5) }} />
        <Remove cssClasses="line-tool" onClick={() => setMode('line')} style={{ opacity: (mode === 'line' ? 1 : 0.5) }} />
        <SquareOutline cssClasses="square-tool" onClick={() => setMode('rectangle')} style={{ opacity: (mode === 'rectangle' ? 1 : 0.5) }} />
        <EllipseOutline cssClasses="ellipse-tool" onClick={() => setMode('circle')} style={{ opacity: (mode === 'circle' ? 1 : 0.5) }} />
        <Trash cssClasses="trash-tool" onClick={() => onRemove()} style={{ opacity: (mode === 'edit' ? 1 : 0.5) }} />
        <Text cssClasses="text-tool" onClick={() => {
          // setMode('text')
          onText("New Text", {
            fontFamily: 'Arial',
            // fontSize: size,
            fontSize: 20,
            fill: color
          })
        }} style={{ opacity: (mode === 'text' ? 1 : 0.5) }} />
        {/* <ChevronForward onClick={() => onNext()} /> */}
      </div>

      <div className="color-row">
        <div className="brush-colors">
          {
            colors.map(col => <div key={col} className={classNames("color", { selected: color === col })} onClick={() => setColor(col)} style={{ "--brush-color": col, "borderColor": (col === "#FFFFFF") ? "black" : col } as any}></div>)
          }
        </div>
      </div>
    </div>
  </>
};

export interface DrawProps {
  onNext: (svgString: string) => void;
  onBack: () => void;
  setRef?: (r: any) => void;
}

const ToolMap = {
  "drawing": Tools.Pencil,
  "line": Tools.Line,
  "rectangle": Tools.Rectangle,
  "circle": Tools.Circle,
}

const Draw: React.FC<DrawProps> = ({ onNext, onBack, setRef }) => {
  const [mode, setMode] = useState<Mode>("edit");
  // @ts-ignore
  const currentTool: keyof Tools = ToolMap[mode] || Tools.Select;
  const overlayOpacity = (mode === "text") ? 0.5 : 0;

  const [color, setColor] = useState<Color>(colors[0]);
  const [size, setSize] = useState<Size>(8);

  const [sketchRef, setSketchRef] = useState<any>(null);
  const onText = useCallback((text: string, options = {}) => {
    if (sketchRef && !!text.trim()) {
      sketchRef.addText(text, options);
    }
    setMode("edit");
  }, [setMode, sketchRef]);

  const onRemove = useCallback(() => {
    if (sketchRef) {
      sketchRef.removeSelected();
    }
  }, [sketchRef]);

  const onUndo = useCallback(() => {
    if (sketchRef) {
      sketchRef.undo();
    }
  }, [sketchRef]);

  const onNextHandler = useCallback(() => {
    // console.log("Json",sketchRef.toJSON());
    // console.log("dataurl", sketchRef.toDataURL());
    // console.log("svg", sketchRef._fc.toSVG());
    onNext(sketchRef._fc.toSVG());
  }, [onNext, sketchRef]);

  const setColorHandler = useCallback((color: Color) => {
    // set selection to color
    setColor(color);
    {
      if (!sketchRef || !sketchRef._fc) return;
      let canvas = sketchRef._fc;
      let activeObj = canvas.getActiveObject();
      // console.log("made it thro to color ", sketchRef, canvas, activeObj)
      if (activeObj) {
        let selected = [];
        if (activeObj.type === 'activeSelection') {
          activeObj.forEachObject((obj: any) => selected.push(obj));
        } else {
          selected.push(activeObj)
        }
        selected.forEach(obj => {
          // obj.__removed = true;
          // let objState = obj.toJSON();
          // obj.__originalState = objState;
          // let state = JSON.stringify(objState);
          // this._history.keep([obj, state, state]);
          // canvas.remove(obj);
          obj.fill = color;
          obj.stroke = color;
          obj.dirty = true;
          obj.setOptions({
            fill: color,
            stroke: color,
            dirty: true
          })
        });
        canvas.renderAll();
      }
    }
  }, [sketchRef]);

  return <div className="Draw">
    <div className="video-wrapper" style={{}}></div>
    <div className="video-overlay" style={{ opacity: overlayOpacity }}></div>
    <div className={classNames("edit-wrapper", mode)}>
      <DrawCanvas
        tool={currentTool}
        lineColor={color}
        lineWidth={(mode === "rectangle" || mode === "circle") ? 30 : size}
        fillColor={color}
        // @ts-ignore
        sketchRef={r => { setSketchRef(r); setRef && setRef(r) }}
      ></DrawCanvas>
      <DrawPanel
        mode={mode} setMode={setMode}
        color={color} setColor={setColorHandler}
        size={size} setSize={setSize}
        onRemove={onRemove}
        onText={onText}
        onNext={onNextHandler}
        onBack={onBack}
        onUndo={onUndo}
      ></DrawPanel>
    </div>
  </div>
};

export default Draw;
