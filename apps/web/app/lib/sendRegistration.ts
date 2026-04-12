export const sendRegistration=async (songs:any) => {
        console.log("type of songs" , typeof(songs))
        console.log(songs)
          const registration = await navigator.serviceWorker.ready
        console.log("started navigations")
          songs.map((song: any)=>{  
            console.log("sending songid as" , song.songId)
            console.log("sending song url as" , song.url)
            registration.active?.postMessage({
                songId : song.songId,
                url : song.url
            })
          })
        }