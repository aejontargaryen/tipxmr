import React, { useEffect, useState } from "react";
import PropTypes from "prop-types";

import monerojs from "../../libs/monero";

import { Progressbar, SyncBanner } from "../../components";

function Wallet({ walletFunctions, walletVariables }) {
  const [isSynced, setIsSynced] = useState(false);

  function syncHandler(e) {
    if (walletVariables.isSyncActive) {
      monerojs.stopSyncing(walletVariables.wallet);
      walletFunctions.setIsSyncActive(false);
      setIsSynced(false);
    } else {
      walletFunctions.syncWallet();
      checkIsSynced();
    }
  }

  function checkIsSynced() {
    if (walletVariables.percentageSynced > 99.9) {
      setIsSynced(true);
    } else {
      setIsSynced(false);
    }
  }
  useEffect(() => {
    checkIsSynced();
  }, [walletVariables.percentageSynced]);

  return (
    <div className="h-full">
      <div className="w-1/2 mx-auto mb-4 text-gray-200 text-center">
        <SyncButton synced={isSynced} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="rounded overflow-hidden shadow-lg text-center bg-xmrgray-darker text-xmrorange-lighter">
          <div className="px-4 py-6">
            <p>Your Balance</p>
            <div className="text-4xl my-2">1337 XMR</div>
          </div>
        </div>
        <div className="rounded overflow-hidden shadow-lg text-center bg-xmrgray-darker text-xmrorange-lighter">
          <div className="px-4 py-6">
            <p>Total Transactions</p>
            <div className="text-4xl my-2">420</div>
          </div>
        </div>
        <div className="rounded overflow-hidden shadow-lg text-center bg-xmrgray-darker text-xmrorange-lighter">
          <div className="px-4 py-6">
            <p>Sync Status</p>
            <div className="text-4xl my-2">
              <Progressbar
                percentage={walletVariables.percentageSynced}
                isSyncActive={walletVariables.isSyncActive}
                isSynced={isSynced}
              />
            </div>
          </div>
        </div>
      </div>
      <div className="mt-12 mx-auto w-3/4">
        <button
          onClick={syncHandler}
          className="bg-xmrorange hover:bg-xmrorange-darker text-white font-bold my-16 py-2 px-4 rounded"
        >
          {walletVariables.isSyncActive ? "Stop Sync" : "Start Sync"}
        </button>
        <h2 className="text-3xl text-center my-3">Transaction History</h2>
        {/* Dynamische Tabelle nach dieser Anleitung */}
        <table className="table-auto border-4 mx-auto">
          <thead>
            <tr className="text-xl">
              <th className="px-4 py-2">Amount</th>
              <th className="px-4 py-2">Height</th>
              <th className="px-4 py-2">Date</th>
              <th className="px-4 py-2">Confirmations</th>
            </tr>
          </thead>
          <tbody></tbody>
        </table>
      </div>
    </div>
  );
}

// Defining property types
Wallet.propTypes = {
  walletFunctions: PropTypes.object,
  walletVariables: PropTypes.object,
};

export default Wallet;
