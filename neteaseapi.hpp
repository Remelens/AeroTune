/*
 * neteaseapi.hpp
 *
 * Netease Cloud Music API in Cpp
 */
#ifndef _NETEASEAPI_HPP_
#define _NETEASEAPI_HPP_

#define CPPHTTPLIB_OPENSSL_SUPPORT
#include "httplib.h"

namespace Netease{
    const std::string url="https://music.163.com";
    const std::string userAgent="Mozilla/5.0 (X11; Linux x86_64; rv:140.0) Gecko/20100101 Firefox/140.0";
    const std::string defaultContentType="application/x-www-form-urlencoded";//Content-type default
    httplib::Client api(url);
    httplib::Headers apiheader={
        {"Referer",url},
        {"User-agent",userAgent}
    };
    httplib::Result Post(
        std::string path,
        std::string data,
        std::string contentType=defaultContentType,
        httplib::Headers headers=apiheader
    ){
        return api.Post(path,headers,data,contentType);
    }
    httplib::Result Get(
        std::string path,
        httplib::Headers headers=apiheader
    ){
        return api.Get(path,headers);
    }
};

#endif /* _NETEASEAPI_HPP_ */
