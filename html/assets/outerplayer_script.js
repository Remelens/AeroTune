console.log("%c AeroTune %c OuterPlayer ","font-size:14px;background:#f3f2eb;color:#272829;","font-size:14px;background:#272829;color:#f3f2eb;");
console.log("GitHub: https://github.com/Remelens/AeroTune");

var player=document.getElementById('playbox-player');
var body=document.body;
var playbox=document.getElementById("playbox");
var albumArt=document.getElementById("album-art");
var trackTitle=document.getElementById("track-title");
var trackArtist=document.getElementById("track-artist");
var trackBar=document.getElementById('track-bar');
var trackButton=document.getElementById('track-btn');
var trackPlayed=document.getElementById("track-played");
var buttonPlay=document.getElementById("btn-play");
var buttonPrev=document.getElementById("btn-prev");
var buttonNext=document.getElementById("btn-next");
var playedTime=document.getElementById("played-time");
var baseTime=document.getElementById("base-time");
var playlistLists=document.getElementById("playlist-lists");

var trackDrugging=false;
var autoplayMusic=false;
var playlistMode=playbox.classList.contains("mode-playlist");
var playlistModeEx="playlist";//playlist or album
var playlist=[];//[{id,title,artist,albumarturl}]
var playlistIndex=1;

function toTimeString(timeevent){
    let second=Math.floor(timeevent%60);
    let minute=Math.floor(timeevent/60);
    second=(second<10?`0${second}`:`${second}`);
    minute=(minute<10?`0${minute}`:`${minute}`);
    return `${minute}:${second}`;
}
function playbtn(){
    if(!player.readyState){
        //unable to play
        return;
    }
    if(player.paused){
        player.play();
    }else{
        player.pause();
    }
}
function getEmSize(element) {
    const fontSize = window.getComputedStyle(element).fontSize;
    return parseFloat(fontSize);
}

function getWidth(element,text) {
    const style = window.getComputedStyle(element);
    const font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.font = font;
    return ctx.measureText(text).width;
}
function getMusicDetails(id, callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/song/detail', true);
    xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
            callback(null, xhr.response); // Success
        } else {
            callback(new Error(`Request failed with status ${xhr.status}`), null);
        }
    };
    xhr.onerror = function() {
        callback(new Error('Request failed'), null);
    };
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.send(`ids=[{"id":${id}}]`);
}
function getMusicListDetails(data, callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/song/detail', true);
    xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
            callback(null, xhr.response); // Success
        } else {
            callback(new Error(`Request failed with status ${xhr.status}`), null);
        }
    };
    xhr.onerror = function() {
        callback(new Error('Request failed'), null);
    };
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.send(data);
}
function getMusicSrc(id,br,callback) {
    //`https://music.163.com/song/media/outer/url?id=${query}.mp3`
    let xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/song/outersrc', true);
    xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
            callback(null, xhr.response); // Success
        } else {
            callback(new Error(`Request failed with status ${xhr.status}`), null);
        }
    };
    xhr.onerror = function() {
        callback(new Error('Request failed'), null);
    };
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.send(`ids=[${id}]&br=${br}`);
}
function getPlaylist(id,callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/playlist/detail', true);
    xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
            callback(null, xhr.response); // Success
        } else {
            callback(new Error(`Request failed with status ${xhr.status}`), null);
        }
    };
    xhr.onerror = function() {
        callback(new Error('Request failed'), null);
    };
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.send(`id=${id}`);
}
function getAlbum(id,callback) {
    let xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/album/detail', true);
    xhr.onload = function() {
        if (xhr.status >= 200 && xhr.status < 300) {
            callback(null, xhr.response); // Success
        } else {
            callback(new Error(`Request failed with status ${xhr.status}`), null);
        }
    };
    xhr.onerror = function() {
        callback(new Error('Request failed'), null);
    };
    xhr.setRequestHeader('Content-Type', 'application/x-www-form-urlencoded');
    xhr.send(`id=${id}`);
}
function trackInfoFitContent(){
    let trackInfoWidth=document.body.offsetWidth-getEmSize(document.body)*3-60;
    if(getWidth(trackTitle,trackTitle.textContent)>trackInfoWidth){
        trackTitle.classList.add('marquee');
    }else if(trackTitle.classList.contains('marquee')){
        trackTitle.classList.remove('marquee');
    }
    if(getWidth(trackArtist,trackArtist.textContent)>trackInfoWidth){
        trackArtist.classList.add('marquee');
    }else if(trackArtist.classList.contains('marquee')){
        trackArtist.classList.remove('marquee');
    }
}
function loadMusic(url,title,artist,albumarturl=""){
    player.src=url;
    trackTitle.innerHTML=title;
    trackArtist.innerHTML=artist;
    albumArt.src=albumarturl;
    if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
            title: title,
            artist: artist,
            artwork: [
                { src: albumarturl }
            ]
        });
        navigator.mediaSession.setActionHandler("previoustrack",loadPrevMusic);
        navigator.mediaSession.setActionHandler("nexttrack",loadNextMusic);
    }
    if(albumarturl&&albumArt.classList.contains("default-album")){
        albumArt.classList.remove("default-album");
    }else if(albumarturl===""&&!albumArt.classList.contains("default-album")){
        albumArt.classList.add("default-album");
    }
    trackInfoFitContent();
}
function loadNextMusic(){
    var atply=false;
    if(playlistIndex>=playlist.length){
        playlistIndex=1;
    }else{
        playlistIndex+=1;
    }
    if(!player.paused){
        atply=true;
    }
    loadMusic(
        `https://music.163.com/song/media/outer/url?id=${playlist[playlistIndex-1].id}.mp3`,
        playlist[playlistIndex-1].title,
        playlist[playlistIndex-1].artist,
        playlist[playlistIndex-1].albumarturl + '?param=1024y1024'
    );
    if(atply){
        player.play();
    }
}
function loadPrevMusic(){
    var atply=false;
    if(playlistIndex<=1){
        playlistIndex=playlist.length;
    }else{
        playlistIndex-=1;
    }
    if(!player.paused){
        atply=true;
    }
    loadMusic(
        `https://music.163.com/song/media/outer/url?id=${playlist[playlistIndex-1].id}.mp3`,
        playlist[playlistIndex-1].title,
        playlist[playlistIndex-1].artist,
        playlist[playlistIndex-1].albumarturl + '?param=1024y1024'
    );
    if(atply){
        player.play();
    }
}
function loadPlaylist(list){
    playlistLists.innerHTML="";
    for(let i in list){
        let playlistItem=document.createElement("div");
        let plItemCount=document.createElement("div");
        let plItemTitle=document.createElement("div");
        let plItemArtist=document.createElement("div");
        playlistItem.classList.add("playlist-item");
        plItemCount.classList.add("pl-item-count");
        plItemTitle.classList.add("pl-item-title");
        plItemArtist.classList.add("pl-item-artist");
        plItemCount.innerHTML=`${parseInt(i)+1}`;
        plItemTitle.innerHTML=list[i].title;
        plItemArtist.innerHTML=list[i].artist;
        playlistItem.appendChild(plItemCount);
        playlistItem.appendChild(plItemTitle);
        playlistItem.appendChild(plItemArtist);
        playlistLists.appendChild(playlistItem);
    }
}
function readLyric(lyric){
    let lyline=lyric.split('\n'),tmp='';
    let lyret=new Array();
    for(let lyi in lyline){
        tmp=lyline[lyi].match(/^\[[0-9:.]*\]/)[0];
        tmp=tmp.substring(1,tmp.length-1);
        tmp=tmp.split(/[:.]/);
        if(tmp.length===2){
            lyret.push({'stamp':Math.abs(tmp[0])*60+Math.abs(tmp[1]),'lyric':lyline[lyi].split(/^\[[0-9:.]*\]/)[1]});
        }else if(tmp.length===3){
            lyret.push({'stamp':Math.abs(tmp[0])*60+Math.abs(tmp[1])+Math.abs(tmp[2])*0.01,'lyric':lyline[lyi].split(/^\[[0-9:.]*\]/)[1]});
        }
    }
    return lyret;
}

var lyrics=readLyric('[00:00.00]未知');

addEventListener('resize',function(event){
    trackInfoFitContent();
});
buttonPlay.addEventListener('click',function(event){
    playbtn();
});
buttonPrev.addEventListener('click',function(event){
    loadPrevMusic();
});
buttonNext.addEventListener('click',function(event){
    loadNextMusic();
});
playlistLists.addEventListener('click',function(event){
    if(event.target.classList.contains("playlist-item")){
        playlistIndex=parseInt(event.target.querySelector(".pl-item-count").textContent);
    }else if(event.target.classList.contains("pl-item-title")||event.target.classList.contains("pl-item-artist")||event.target.classList.contains("pl-item-count")){
        playlistIndex=parseInt(event.target.parentNode.querySelector(".pl-item-count").textContent);
    }else{
        return;
    }
    loadMusic(
        `https://music.163.com/song/media/outer/url?id=${playlist[playlistIndex-1].id}.mp3`,
        playlist[playlistIndex-1].title,
        playlist[playlistIndex-1].artist,
        playlist[playlistIndex-1].albumarturl + '?param=1024y1024'
    );
    player.play();
});
player.addEventListener('error',function(event){
    player.pause();
    trackPlayed.style.width=0;
    baseTime.innerHTML="00:00";
    let itemsWithCnt=playlistLists.querySelectorAll(".playlist-item.current");
    itemsWithCnt.forEach(item => {
        item.classList.remove("current");
    });
    playlistLists.getElementsByClassName("playlist-item")[playlistIndex-1].classList.add("current");
});
player.addEventListener('loadeddata',function(event){
    baseTime.innerHTML=toTimeString(player.duration);
    trackInfoFitContent();
    let itemsWithCnt=playlistLists.querySelectorAll(".playlist-item.current");
    itemsWithCnt.forEach(item => {
        item.classList.remove("current");
    });
    playlistLists.getElementsByClassName("playlist-item")[playlistIndex-1].classList.add("current");
    if(autoplayMusic){
        player.play();
    }
});
player.addEventListener('ended',function(event){
    trackPlayed.style.width=0;
    if(playlistMode){
        loadNextMusic();
        player.play();
    }
});
trackBar.addEventListener('mousedown',function(event){
    if(!player.readyState){
        return;
    }
    trackDrugging=true;
    let proc=event.offsetX/trackBar.offsetWidth;
    player.currentTime=player.duration*proc;
    trackPlayed.style.width=`${proc*100}%`;
});
trackButton.addEventListener('mousedown',function(event){
    if(!player.readyState){
        return;
    }
    trackDrugging=true;
    let proc=event.offsetX/trackBar.offsetWidth;
    player.currentTime=player.duration*proc;
    trackPlayed.style.width=`${proc*100}%`;
});
document.addEventListener('mousemove',function(event){
    if(trackDrugging){
        if(event.clientX<trackBar.offsetLeft){
            //over-drugged
            player.currentTime=0;
        }else if(event.clientX>trackBar.offsetLeft+trackBar.offsetWidth){
            player.currentTime=player.duration;
        }else{
            player.currentTime=player.duration*(event.clientX-trackBar.offsetLeft)/trackBar.offsetWidth;
        }
    }
});
document.addEventListener('mouseup',function(event){
    if(trackDrugging){
        trackDrugging=false;
    }
});
player.addEventListener('timeupdate',function(event){
    let proc=player.currentTime/player.duration;
    baseTime.innerHTML=toTimeString(player.duration);
    playedTime.innerHTML=toTimeString(player.currentTime);
    trackPlayed.style.width=`${proc*100}%`;
    /*
    if(lyrics.find(item=>item.stamp===player.currentTime)){
        console.log(lyrics.find(item=>item.stamp===player.currentTime).lyric);
    }
    */
});
//TODO
player.addEventListener('play',function(event){
    if(buttonPlay.querySelector("i").classList.contains("ic-play")){
        buttonPlay.querySelector("i").classList.add("ic-stop");
        buttonPlay.querySelector("i").classList.remove("ic-play");
    }
});
player.addEventListener('pause',function(event){
    if(buttonPlay.querySelector("i").classList.contains("ic-stop")){
        buttonPlay.querySelector("i").classList.add("ic-play");
        buttonPlay.querySelector("i").classList.remove("ic-stop");
    }
});
//TODO END.

trackInfoFitContent();
