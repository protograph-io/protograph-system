import React, { useContext, useMemo } from 'react';
import { InterfaceContext } from '../context/InterfaceProvider';
import { logStateChange } from '../core/helpers';


export const StatusMessage: React.FC<{}> = () => {
    const { status } = useContext(InterfaceContext);
    logStateChange("rerending status message react wrapper");
    return useMemo(() => {
      logStateChange("rerending status message innner component");
      return <div className={"status-notice " + ((status.status === "success") ? "success" : "error")}>{status.message}</div>;
    }, [status]);
  }