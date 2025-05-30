import React from "react";

export type IpfsState = "connecting" | "connected" | "error";

const IpfsStatus: React.FC<{ status: IpfsState }> = ({ status }) => (
  <div className="ipfs-status">
    {status === "connecting" && <>🔵 Підключення до IPFS…</>}
    {status === "connected"  && <span style={{ color: "green" }}>🟢 IPFS підключено</span>}
    {status === "error"      && (
      <span style={{ color: "red" }}>🔴 IPFS не відповідає</span>
    )}
  </div>
);

export default IpfsStatus; 