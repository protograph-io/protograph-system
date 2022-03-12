
import { debounce } from 'protograph/lib/core/helpers';
import React, { useEffect, useState } from 'react';
import { record } from "rrweb";
import { Docs } from '../components/Docs/Docs';
import { DocsViewProvider } from '../components/Docs/DocsContext';
import { CodeMirrorMemo } from '../components/Editor';
import { RenderPane } from '../components/RenderPane';
import { Share } from '../components/Share/Share';
import { StatusMessage } from '../components/StatusMessage';
import { Toolbar } from '../components/Toolbar';
import { Tour, tourStarterCode } from '../components/Tour/Tour';
import { Welcome } from '../components/Welcome';
import { InterfaceProvider, setState } from '../context/InterfaceProvider';
import { addToUrl, getUrlCode } from '../context/state';
import { supabase } from './Study';
const url = require('url-parameters').default;

console.log("PROTOTYPE TOOL");

// const saved = getUrlCode() || localStorage.getItem(LOCAL_STORAGE_KEY);
const saved = getUrlCode();

export const existingUserLocalStorageKey = "existing_user";
export const newUser = !localStorage.getItem(existingUserLocalStorageKey);
export function setExistingUser(): void {
  localStorage.setItem(existingUserLocalStorageKey, "true");
}

const ViewContext = React.createContext<{
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: setState<boolean>
}>({
  isMobileMenuOpen: false,
  setIsMobileMenuOpen: () => undefined
});
const ViewProvider: React.FC = ({ children }) => {
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





// Create a single supabase client for interacting with your database
// const supabase = createClient('http://174.138.37.225:8000', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTYwMzk2ODgzNCwiZXhwIjoyNTUwNjUzNjM0LCJhdWQiOiIiLCJzdWIiOiIiLCJyb2xlIjoiYW5vbiJ9.jKsLhQ4SoUoOeC4IyDxPzvotqCKz77kdQ49WRzyP0kw');
// const supabase = createClient('https://ndlyjqgtpotzlfsyvyxf.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYyODYwNzkyOCwiZXhwIjoxOTQ0MTgzOTI4fQ.J8wdFF60fQjfj8Zh5vhy8cpbpEHKkvgIcDaHnmDVHT0');

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


const fork_url = url.get("id");
let prototype_id: string | undefined = undefined;
const debouncedSaveProgress = debounce((code: string, frames: string[]) => {
  if (prototype_id === undefined) {
    supabase.from("prototypes").insert({
      "fork_id": fork_url || null,
      code,
      previews: frames
    }).then(({ data, error }) => {
      console.log("db insert", data, error);
      if (!error && data && data.length && data[0].id) prototype_id = data[0].id;
      addToUrl(code, prototype_id);
    });
  } else {
    supabase.from("prototypes").update({
      "fork_id": fork_url || null,
      code,
      previews: frames
    }, { returning: "minimal" }).eq("id", prototype_id).then(({ data, error }) => {
      console.log("db update", data, error);
      addToUrl(code, prototype_id);
    })
  }
}, 5000);


// const debouncedSaveEvents = debounce((events: any[]) => {
//   console.log("saving events", prototype_id)
//   if (prototype_id !== undefined) {
//     supabase.from("prototypes").update({
//       events
//     }, {
//       returning: "minimal"
//     }).eq("id", prototype_id).then(({ data, error }) => {
//       console.log("db saving events database result", data, error)
//     })
//   }
// }, 5000);








const tourFlag = url.get('tour') === "true";

function PrototypeTool() {
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [starterCode, setStarterCode] = useState(saved);
  const [isWelcomeOpen, setIsWelcomeOpen] = useState(!tourFlag && !newUser && !starterCode && (saved === undefined || saved === null));

  // useEffect(() => {

  //   // let events: any[] = [];
  //   // record({
  //   //   recordCanvas: true,
  //   //   emit(event) {
  //   //     // store the event in any way you like
  //   //     events.push(event);
  //   //     // debouncedSaveEvents(events)
  //   //   },
  //   // });

  // }, []);

  return (
    <InterfaceProvider starterCode={starterCode || tourStarterCode} saveHandler={debouncedSaveProgress} includePreview={false}>
      {isWelcomeOpen && <Welcome onSelect={(text) => {
        setIsWelcomeOpen(false);
      }} onClose={() => setIsWelcomeOpen(false)}></Welcome>}
      {isShareOpen && <Share onClose={() => setIsShareOpen(false)}></Share>}
      <Tour isTourOpen={(newUser && !starterCode) || tourFlag}></Tour>
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

export default PrototypeTool;
