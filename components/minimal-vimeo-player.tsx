'use client';

import Player from '@vimeo/player';
import {Pause,Play,Volume2,VolumeX} from 'lucide-react';
import {useEffect,useMemo,useRef,useState} from 'react';

type Props={src:string;title:string};

export default function MinimalVimeoPlayer({src,title}:Props){
 const frame=useRef<HTMLIFrameElement>(null),player=useRef<Player|null>(null),lastVolume=useRef(.75);
 const [playing,setPlaying]=useState(false),[volume,setVolumeState]=useState(.75),[speed,setSpeedState]=useState(1),[ready,setReady]=useState(false);
 const playerSrc=useMemo(()=>{const url=new URL(src);for(const [key,value] of Object.entries({controls:'0',title:'0',byline:'0',portrait:'0',keyboard:'0',pip:'0',playsinline:'1'}))url.searchParams.set(key,value);return url.toString()},[src]);

 useEffect(()=>{
  if(!frame.current)return;
  const instance=new Player(frame.current);player.current=instance;let mounted=true;
  const onPlay=()=>mounted&&setPlaying(true),onPause=()=>mounted&&setPlaying(false),onVolume=(data:{volume:number})=>{if(!mounted)return;setVolumeState(data.volume);if(data.volume>0)lastVolume.current=data.volume},onRate=(data:{playbackRate:number})=>mounted&&setSpeedState(data.playbackRate);
  instance.on('play',onPlay);instance.on('pause',onPause);instance.on('ended',onPause);instance.on('volumechange',onVolume);instance.on('playbackratechange',onRate);
  instance.ready().then(async()=>{if(!mounted)return;const [initialVolume,initialRate]=await Promise.all([instance.getVolume(),instance.getPlaybackRate()]);if(!mounted)return;setVolumeState(initialVolume);if(initialVolume>0)lastVolume.current=initialVolume;setSpeedState(initialRate);setReady(true)}).catch(()=>{});
  return()=>{mounted=false;player.current=null;instance.off('play',onPlay);instance.off('pause',onPause);instance.off('ended',onPause);instance.off('volumechange',onVolume);instance.off('playbackratechange',onRate);void instance.destroy().catch(()=>{})};
 },[playerSrc]);

 async function toggle(){const instance=player.current;if(!instance)return;try{if(await instance.getPaused())await instance.play();else await instance.pause()}catch{}}
 async function setVolume(value:number){const instance=player.current;if(!instance)return;try{await instance.setVolume(value);setVolumeState(value);if(value>0)lastVolume.current=value}catch{}}
 async function setSpeed(value:number){const instance=player.current;if(!instance)return;try{await instance.setPlaybackRate(value);setSpeedState(value)}catch{}}

 return <div className="tp-minimal-player">
  <iframe ref={frame} src={playerSrc} title={title} allow="autoplay" tabIndex={-1}/>
  <div className="tp-player-controls" aria-label="Video controls">
   <button type="button" aria-label={playing?'Pause video':'Play video'} onClick={toggle} disabled={!ready}>{playing?<Pause size={19}/>:<Play size={19}/>}</button>
   <button type="button" aria-label={volume===0?'Unmute video':'Mute video'} onClick={()=>setVolume(volume===0?lastVolume.current:0)} disabled={!ready}>{volume===0?<VolumeX size={19}/>:<Volume2 size={19}/>}</button>
   <input aria-label="Video volume" type="range" min="0" max="1" step="0.05" value={volume} onChange={event=>setVolume(Number(event.target.value))} disabled={!ready}/>
   <label>Speed<select aria-label="Lesson speed" value={speed} onChange={event=>setSpeed(Number(event.target.value))} disabled={!ready}>{[.75,1,1.25,1.5,1.75,2].map(value=><option key={value} value={value}>{value}×</option>)}</select></label>
  </div>
 </div>
}
