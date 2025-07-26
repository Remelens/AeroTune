class NeteaseApi{
    static #api(body){
        var xhr = new XMLHttpRequest();
        xhr.open('POST', '/api/play', true);
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
        xhr.send(`idlists=[{"id":${id}}]`);
    }
    static getMusicDetailsFromNetease(id, callback) {

    }

};
