import React from 'react';
import {SketchField, Tools} from 'react-sketch2';
import { useDimensions } from 'react-dimensions-hook';
import './DrawCanvas.scss';

// @ts-ignore
type SketchParams = Record<string, any> & {tool: keyof Tools};
export interface DrawCanvasProps extends Partial<SketchParams> { 
  sketchRef?: any
}

const DrawCanvas: React.FC<DrawCanvasProps> = ({...props}) => {
  const { ref, dimensions } = useDimensions();
  return (
    <div ref={ref} className="DrawCanvas">
      <SketchField 
        width={dimensions.width + "px"}
        height={dimensions.height + "px"}
        tool={Tools.Pencil}
        lineColor='black'
        lineWidth={3} 
        {...props}
        // @ts-ignore
        ref={(c) => {props.sketchRef(c);}}
        />
    </div>
  );
};

export default DrawCanvas;
