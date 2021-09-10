
// import { createClient } from '@supabase/supabase-js';
import React, { useEffect } from 'react';
import { Replayer } from "rrweb";
import { InterfaceContext } from '../context/InterfaceProvider';
import { supabase } from './Study';
export { InterfaceContext };
const url = require('url-parameters').default;


// Create a single supabase client for interacting with your database
// const supabase = createClient('http://174.138.37.225:8000', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsImlhdCI6MTYwMzk2ODgzNCwiZXhwIjoyNTUwNjUzNjM0LCJhdWQiOiIiLCJzdWIiOiIiLCJyb2xlIjoiYW5vbiJ9.jKsLhQ4SoUoOeC4IyDxPzvotqCKz77kdQ49WRzyP0kw');
// export const supabase = createClient('https://ndlyjqgtpotzlfsyvyxf.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYyODYwNzkyOCwiZXhwIjoxOTQ0MTgzOTI4fQ.J8wdFF60fQjfj8Zh5vhy8cpbpEHKkvgIcDaHnmDVHT0');

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
const p_id = url.get("id");

function ToolReplayer() {
  useEffect(() => {
      supabase.from("prototypes").select("*").eq("id", p_id).then(({data, error}) => {
        // console.log("database select", data, error)
        if (!error && data && data.length) {
          const replayer = new Replayer(data[0].events, {
            UNSAFE_replayCanvas: true
          });
          // console.log("replay")
          replayer.play();
        }
      })
  });
  return (
    <div></div>
  );
}

export default ToolReplayer;
