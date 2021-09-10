
import React from 'react';
import {
  BrowserRouter as Router, Route, Switch
} from "react-router-dom";
import 'rrweb/dist/rrweb.min.css';
import './App.scss';
import PrototypeTool from './pages/PrototypeTool';
import SketchToCode from "./pages/SketchToCode/SketchToCode";
import Study from './pages/Study';
import Tool from './pages/Tool';
import ToolReplayer from './pages/ToolReplayer';
export * from "./pages/Tool";


export function App() {
  return (
    <Router>
      <div className="App">
        {/* A <Switch> looks through its children <Route>s and
            renders the first one that matches the current URL. */}
        <Switch>
          <Route path="/" exact>
            <PrototypeTool></PrototypeTool>
          </Route>
          <Route path="/tool/" exact>
            <PrototypeTool></PrototypeTool>
          </Route>
          <Route path="/original/" exact>
            <Tool></Tool>
          </Route>
          <Route path="/tool/original" exact>
            <Tool></Tool>
          </Route>
          <Route path="/replayer" exact>
            <ToolReplayer></ToolReplayer>
          </Route>
          <Route path="/tool/replayer" exact>
            <ToolReplayer></ToolReplayer>
          </Route>
          <Route path="/sketch-to-code">
            <SketchToCode onNext={() => {}}></SketchToCode>
          </Route>
          <Route path="/tool/sketch-to-code">
            <SketchToCode onNext={() => {}}></SketchToCode>
          </Route>
          <Route path="/study">
            <Study></Study>
            {/* <CodeToSketch></CodeToSketch> */}
          </Route>
          <Route path="/tool/study">
          <Study></Study>
            {/* <CodeToSketch></CodeToSketch> */}
          </Route>
        </Switch>
      </div>
    </Router>
  );
}

export default App;
