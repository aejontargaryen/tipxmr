import React, { useState, useEffect } from "react";
import { Route, BrowserRouter as Router } from "react-router-dom";
import monerojs from "./libs/monero";
import socketio from "./libs/socket";

import * as WalletContext from "./context/wallet";

import {
  Header,
  Footer,
  Start,
  Donate,
  Login,
  CreateWallet,
  OpenWallet,
  Animation,
  Dashboard,
  Disclaimer,
  FAQ,
} from "./components";

function App() {
  let walletUseEffectDidFire = false;
  const [wallet, setWallet] = useState(null);
  const [primaryAddress, setPrimaryAddress] = useState(null);
  const [currentSyncBlockheight, setCurrentSyncBlockheight] = useState(null);
  const [percentageSynced, setPercentageSynced] = useState(0);
  const [isSyncActive, setIsSyncActive] = useState(false);
  const [donorInfo, setDonorInfo] = useState([]);
  const [donationsQueue, setDonationsQueue] = useState([]);
  const [donationsHistory, setDonationsHistory] = useState([]);

  const [customWallet, dispatch] = WalletContext.useWallet();
  console.log("customWallet", customWallet);

  const [streamerConfig, setStreamerConfig] = useState({
    hashedSeed: "", // acts as password for login
    displayName: "AlexAnarcho", // name to show to donator
    userName: "alexanarcho", // lowercase displayName
    isOnline: false, // show if streamer is currently able to recieve payments
    streamerSocketId: "",
    creationDate: "20.4.2020", // track since when the user is registered
    restoreHeight: 667580,
    profilePicture: "", // allow the user to upload a user avatar
    accountTier: {
      basic: true, // only basic functions available for customizations
      advanced: true, // more customisations
      premium: true, // all customisations available
    },
    streamURLS: {
      // stream urls to display on the streamers donation site
      // only 4 examples, more options can be added later on
      twitch: "mydirtyhobby.com",
      youtube: "",
      chaturbate: "",
      dLive: "",
    },
    animationSettings: {
      secondPrice: 0.00043, // XMR price of a second of display time
      fontColor: "#F23456", // fontColor of the animation text
      fontSize: "xl", // size of animation text
      fontShadow: false, // enable a shadow around text
      minAmount: 0.00043, // donations must be equal to or greater than minAmount
      gifs: true, // allow users to include gifs as message
      gifsMinAmount: 0, // min amount to let user send a gif
      showGoal: false, // let the streamer decide whether to show a goal or not
      goal: 1, // goal amount in XMR
      goalProgress: 0, // how many XMR already paid towards goal
      goalReached: false, // maybe unnecessary, if true, reset the goal
      charLimit: 1000, // upperlimit for message length
      sound: "/src/sounds/crocodile.mp3", // custom mp3 sound, needs to be an attachement
      bgImg: "", // show background image in stream
    },
    donationStats: {
      totalDonations: 0, // increment with every donation
      largestDonation: 0, // show largest donation
      allDonations: [
        // objects of all transactions, basically array of donorInfo
        {
          1: {
            donor: "Grischa",
            message: "Hello",
            amount: 123, // amount in XMR
            date: "", // datetime object to track a timeline
          },
        },
      ],
    },
  });

  // FIXME: move wallet handling into context completely
  useEffect(() => {
    dispatch({ type: "SET_WALLET", wallet });
  }, [wallet]);

  useEffect(() => {
    if (streamerConfig && streamerConfig.restoreHeight) {
      dispatch({
        type: "SET_RESTORE_HEIGHT",
        restoreHeight: streamerConfig.restoreHeight,
      });
    }
  }, [streamerConfig.restoreHeight]);

  /* Example for donorInfo object: {
    donatorSocketId: "5NXW3Rj1eKRqjE9sAAOw"
    donor: "Grischa"
    hashedSeed: null
    message: "Test 6"
    displayName: "MoneroMumble"
    subaddress: "76ABPQ3e2GmVAkDf7BQwXcFb3QCfwG2osQpJo8J3WVVoa4ZrXzPxoEm9fPq7nHdFJMZ32q7B5qGNbBJCiaSBzSAJ1wgFwJi"
    }
    */

  function getNewOutput(output) {
    console.log("getNewOutput aufgerufen, output:", output);
    monerojs
      .getSubaddress(wallet, output.subaddressIndex)
      .then((subaddress) => {
        console.log("Donation an diese Subaddresse:", subaddress);
        console.log("donorInfo:", donorInfo);
        const donationsInfo = donorInfo.find(
          (donationInfo) => donationInfo.subaddress === subaddress
        );
        if (donationsInfo !== undefined) {
          const newDonation = {
            subaddress: subaddress,
            amount: output.amount,
            donor: donationsInfo.donor,
            message: donationsInfo.message,
          };
          console.log("New Donation:", newDonation);
          setDonationsQueue((previousArray) => [...previousArray, newDonation]);
          setDonationsHistory((previousArray) => [
            ...previousArray,
            newDonation,
          ]);
          console.log("donationsInfo:", donationsInfo);
          return newDonation;
        }
        return null;
      })
      .then((newDonation) => {
        if (newDonation !== null && newDonation !== undefined) {
          socketio.emitPaymentRecieved(newDonation);
        }
      });
  }

  const mwl = new monerojs.MyWalletListener(
    setPercentageSynced,
    setCurrentSyncBlockheight,
    getNewOutput
  );

  async function syncWallet() {
    setIsSyncActive(true);
    monerojs
      .startSyncing(wallet, mwl, streamerConfig.restoreHeight)
      .catch((err) => {
        console.error(err);
        setIsSyncActive(false);
      });
  }

  function handleOnNewSubaddress(data) {
    monerojs.createSubaddress(wallet).then((subaddress) => {
      const newDonorInfo = { ...data, subaddress: subaddress };
      setDonorInfo((previousArray) => [...previousArray, newDonorInfo]);
      socketio.emitSubaddressToBackend(newDonorInfo);
      console.log("created Subaddress for:", newDonorInfo);
    });
  }

  // as soon as wallet is loaded
  useEffect(() => {
    if (wallet !== null && walletUseEffectDidFire === false) {
      // after login send streamer info
      socketio.emitStreamerInfo(streamerConfig);
      // listen for new request of subaddress generation
      socketio.onCreateSubaddress(handleOnNewSubaddress);
      walletUseEffectDidFire = true;
    }
  }, [wallet, walletUseEffectDidFire]);

  // handleChange for userConfig
  useEffect(() => {
    socketio.emitUpdateStreamerConfig(streamerConfig);
  }, [streamerConfig]);

  useEffect(() => {
    console.log("isSyncActive: ", isSyncActive);
  }, [isSyncActive]);

  // New Block is added to the chain
  useEffect(() => {
    console.log(
      "New Block (" + currentSyncBlockheight + ") added to the blockchain."
    );
  }, [currentSyncBlockheight]);

  function getWalletFunctions() {
    return {
      setStreamerConfig,
      setIsSyncActive,
      syncWallet,
      setWallet,
      setPrimaryAddress,
    };
  }

  function getWalletVariables() {
    return {
      isSyncActive,
      streamerConfig,
      wallet,
      primaryAddress,
      percentageSynced,
    };
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Router>
        <Header />
        <div className="flex-auto flex flex-col">
          <div className="flex flex-full">
            <Route path="/" exact>
              <Start />
            </Route>
            <Route path="/donate/:userName">
              <Donate />
            </Route>
            <Route>
              <Login />
            </Route>
            <Route path="/createwallet" exact>
              <CreateWallet />
            </Route>
            <Route path="/openwallet" exact>
              <OpenWallet
                streamerConfig={streamerConfig}
                setStreamerConfig={setStreamerConfig}
                walletFunctions={getWalletFunctions()}
                walletVariables={getWalletVariables()}
              />
            </Route>
            <Route path="/animation" exact>
              <Animation streamerConfig={streamerConfig} />
            </Route>
            <Route path="/dashboard">
              <Dashboard
                walletFunctions={getWalletFunctions()}
                walletVariables={getWalletVariables()}
                streamerConfig={streamerConfig}
                setStreamerConfig={setStreamerConfig}
              />
            </Route>
            <Route path="/disclaimer">
              <Disclaimer />
            </Route>
            <Route path="/faq">
              <FAQ />
            </Route>
          </div>
        </div>
        <Footer />
      </Router>
    </div>
  );
}

export default App;
