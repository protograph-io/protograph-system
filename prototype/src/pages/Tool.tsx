
import React, { useState } from 'react';
import { Docs } from '../components/Docs/Docs';
import { DocsViewProvider } from '../components/Docs/DocsContext';
import { CodeMirrorMemo } from '../components/Editor';
import { RenderPane } from '../components/RenderPane';
import { Share } from '../components/Share/Share';
import { StatusMessage } from '../components/StatusMessage';
import { Toolbar } from '../components/Toolbar';
import { Tour, tourStarterCode } from '../components/Tour/Tour';
import { Welcome } from '../components/Welcome';
import { InterfaceContext, InterfaceProvider, setState } from '../context/InterfaceProvider';
import { getUrlCode, LOCAL_STORAGE_KEY } from '../context/state';
export { InterfaceContext };
const url = require('url-parameters').default;

// let events: any[] = [];
// record({
//   recordCanvas: true,
//   emit(event) {
//     // store the event in any way you like
//     events.push(event);
//   },
// });

// Show replayer
// window.setTimeout(() => {
//   const replayer = new Replayer(events, {
//     UNSAFE_replayCanvas: true
//   });
//   console.log("replay")
//   replayer.play();
// }, 5000);


const saved = getUrlCode() || localStorage.getItem(LOCAL_STORAGE_KEY);

export const existingUserLocalStorageKey = "existing_user";
export const newUser = !localStorage.getItem(existingUserLocalStorageKey);
export function setExistingUser(): void {
  localStorage.setItem(existingUserLocalStorageKey, "true");
}



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

// View Options
const view = {
  toolbar: (url.get('toolbar') !== "false") ?? true,
  editor: (url.get('editor') !== "false") ?? true,
  playback: (url.get('playback') !== "false") ?? true,
  frames: (url.get('frames') !== "false") ?? true,
};


function Tool() {
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [starterCode, setStarterCode] = useState(saved);
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(!newUser && !starterCode && (saved === undefined || saved === null));

  return (
      <InterfaceProvider starterCode={starterCode || tourStarterCode} includePreview={false}>
        {isWelcomeOpen && <Welcome onSelect={(text) => {
          setIsWelcomeOpen(false);
        }} onClose={() => setIsWelcomeOpen(false)}></Welcome>}
        {isShareOpen && <Share onClose={() => setIsShareOpen(false)}></Share>}
        <Tour isTourOpen={newUser && !starterCode}></Tour>
        <ViewProvider>
          <DocsViewProvider>
            {
              view.toolbar &&
              <Toolbar onNew={() => {
                setIsWelcomeOpen(true)
              }} onShare={() => {
                setIsShareOpen(true)
              }}></Toolbar>
            }
            <div className="panels">
              {
                view.editor &&
                <div className="editor-pane">
                  <CodeMirrorMemo>
                    <StatusMessage></StatusMessage>
                  </CodeMirrorMemo>

                  <Docs showIfPosition="bottom"></Docs>
                </div>
              }
              <RenderPane showFrames={view.frames} showPlayback={view.playback}></RenderPane>
              <Docs showIfPosition="right" className="floating-right"></Docs>
            </div>
          </DocsViewProvider>
        </ViewProvider>
      </InterfaceProvider>
  );
}

export default Tool;
