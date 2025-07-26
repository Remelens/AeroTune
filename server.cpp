#define CPPHTTPLIB_OPENSSL_SUPPORT
#include "httplib.h"
#include <filesystem>
#include <fstream>
#include "error.hpp"
#include "neteaseapi.hpp"
using namespace std;
namespace fs = std::filesystem;
using namespace httplib;
const string name="AeroTune";
const int PORT=8000;
string file_get_contents(string fn){
    ifstream fin (fn.c_str());
    string s,rst;
    while(getline(fin,s)){
        rst+=s+"\n";
    }
    fin.close();
    return rst;
}
string replace_str(string s,string be_repl,string repled){
    int index = 0;
    while (true) {
        index = s.find(be_repl, index);
        if (index == std::string::npos) break;
        s.replace(index, be_repl.size(), repled);
        index += 3;
    }
    return s;
}
string decodeURI(const string &src) {
    string decoded;
    for (size_t i = 0; i < src.length(); ++i) {
        if (src[i] == '%') {
            if (i + 2 < src.length()) {
                std::string hex = src.substr(i + 1, 2);
                char decodedChar = static_cast<char>(std::stoi(hex, nullptr, 16));
                decoded += decodedChar;
                i += 2;
            } else {
                decoded += '%';
            }
        } else if (src[i] == '+') {
            decoded += ' ';
        } else {
            decoded += src[i];
        }
    }
    return decoded;
}
string process_html(string fn,map<string,string> mp){
    ifstream fin (fn.c_str());
    string s,rst;
    while(getline(fin,s)){
        for(auto im=mp.begin();im!=mp.end();++im){
            s=replace_str(s,"%{"+im->first+"}%",im->second);
        }
        rst+=s+"\n";
    }
    fin.close();
    return rst;
}
void songDetail(const Request &req, Response &res){
    string ids = "c="+req.get_param_value("ids");
    Result cres=Netease::Post("/api/v3/song/detail",ids);
    res.set_content(cres->body,"application/json;charset=utf-8");
}
void songOuterSrc(const Request &req, Response &res){
    //`https://music.163.com/song/media/outer/url?id=${query}.mp3`
    string postdata = "ids="+req.get_param_value("ids")+"&br="+req.get_param_value("br");
    Result cres=Netease::Post("/api/song/enhance/player/url",postdata);
    res.set_content(cres->body,"application/json;charset=utf-8");
}
void playlistDetail(const Request &req, Response &res){
    //post: s: recent subscribers(num)
    string postdata="id="+req.get_param_value("id")+"&n=100000&s=0";
    Result cres=Netease::Post("/api/v6/playlist/detail",postdata);
    res.set_content(cres->body,"application/json;charset=utf-8");
}
void albumDetail(const Request &req, Response &res){
    string id=req.get_param_value("id");
    Result cres=Netease::Get("/api/v1/album/"+id);
    res.set_content(cres->body,"application/json;charset=utf-8");
}
int main(){
    cout<<"Server listening at port "<<PORT<<endl;
    cout<<"Url: http://localhost:"<<PORT<<"/"<<endl;
    ecode_init();
    Server svr;
    if (!svr.set_mount_point("/cache/","cache")) {
        cerr << "The specified base directory 'cache' doesn't exist.\nQuitting..."<<endl;
        return 1;
    }
    if (!svr.set_mount_point("/assets/","html/assets")) {
        cerr << "The specified base directory 'html/assets' doesn't exist.\nQuitting..."<<endl;
        return 1;
    }
    svr.Get("/", [](const Request &req, Response &res) {
        map<string,string> mp;
        mp["PORT"]=to_string(PORT);
        res.set_content(process_html("html/index.html",mp), "text/html;charset=utf-8");
    });
    svr.Get("/outerplayer", [](const Request &req, Response &res) {
        map<string,string> mp;
        string reqid=req.get_param_value("id"),autoplay=req.get_param_value("autoplay"),playloop=req.get_param_value("loop");
        string mode=playloop=req.get_param_value("mode");
        if(reqid!=""){
            mp["RequestId"]=reqid;
        }else{
            mp["RequestId"]="";
        }
        if(autoplay=="1"||autoplay=="true"){
            mp["AutoPlay"]="true";
        }else{
            mp["AutoPlay"]="";
        }
        if(playloop=="1"||playloop=="true"){
            mp["Loop"]="loop";
        }else{
            mp["Loop"]="";
        }
        if(mode=="album"||mode=="playlist"){
            mp["PlaylistModeEx"]=mode;
            mp["PlaylistMode"]="mode-playlist";
        }else{
            mp["PlaylistModeEx"]="";
            mp["PlaylistMode"]="";
        }
        res.set_content(process_html("html/outerplayer.html",mp), "text/html;charset=utf-8");
    });
    svr.Post("/api/song/detail",songDetail);
    svr.Post("/api/song/outersrc",songOuterSrc);
    svr.Post("/api/playlist/detail",playlistDetail);
    svr.Post("/api/album/detail",albumDetail);
    svr.Get("/api/:",[](const Request &req, Response &res) {
        string ret="{\"msg\":\"Wrong Method\",\"code\":400}";
        res.set_content(ret, "application/json;charset=utf-8");
    });
    svr.set_error_handler([](const auto& req, auto& res) {
        auto fmt = "<center><h1>%d %s</h1><hr>%s</center>";
        char buf[BUFSIZ];
        snprintf(buf, sizeof(buf), fmt, res.status,ecode[res.status].c_str(),name.c_str());
        res.set_content(buf, "text/html;charset=utf-8");
    });
    svr.listen("0.0.0.0", PORT);
    return 0;
}
