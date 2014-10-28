// Date format
Date.prototype.format = function(format) { 
    var o = { 
    "M+" : this.getMonth()+1, //month 
    "d+" : this.getDate(),    //day 
    "h+" : this.getHours(),   //hour 
    "m+" : this.getMinutes(), //minute 
    "s+" : this.getSeconds(), //second 
    "q+" : Math.floor((this.getMonth()+3)/3),  //quarter 
    "S" : this.getMilliseconds() //millisecond 
    } 
    if(/(y+)/.test(format)) 
    format=format.replace(RegExp.$1, (this.getFullYear()+"").substr(4 - RegExp.$1.length)); 
    for(var k in o)
    if(new RegExp("("+ k +")").test(format)) 
        format = format.replace(RegExp.$1, RegExp.$1.length==1 ? o[k] : ("00"+ o[k]).substr((""+ o[k]).length)); 
    return format; 
}

// TrendsLine Constructor
function TrendsLine(query, start_ts, end_ts, pointInterval){
    //instance property
    this.query = query;
    this.start_ts = start_ts; // 开始时间戳
    this.end_ts = end_ts; // 终止时间戳
    this.pointInterval = pointInterval; // 图上一点的时间间隔
    this.during = end_ts - start_ts; // 整个时间范围
    this.pie_ajax_url = function(query, end_ts, during){
        return "/moodlens/pie/?ts=" + end_ts + "&query=" + query + "&during=" + during;
    }
    this.keywords_ajax_url = function(query, end_ts, during, emotion){
        return "/moodlens/keywords_data/?ts=" + end_ts + "&query=" + "东盟,博览会" + "&during=" + during + "&emotion=" + emotion;
    }
    this.weibos_ajax_url = function(query, end_ts, during, emotion, limit){
        return "/guming/sentiment_post/?query=" + query + "&during=" + during + "&size=" + limit ;
    }
    this.count_ajax_url = function(query, end_ts, during, emotion){
        return "/moodlens/data/?query=" + query + "&ts=" + end_ts + "&during=" + during + "&emotion=" + emotion;
    }
    this.peak_ajax_url = function(data, ts_list, during, emotion){
        return "/moodlens/emotionpeak/?lis=" + data.join(',') + "&ts=" + ts_list + '&during=' + during + "&emotion=" + emotion;
    }
    this.ajax_method = "GET";
    this.call_sync_ajax_request = function(url, method, callback){
        $.ajax({
            url: url,
            type: method,
            dataType: "json",
            async: false,
            success: callback
        })
    }
    this.call_async_ajax_request = function(url, method, callback){
        $.ajax({
            url: url,
            type: method,
            dataType: "json",
            async: true,
            success: callback
        })
    }
    this.range_count_data = {};
    this.range_keywords_data = {};
    this.range_weibos_data = {};
    this.top_keywords_limit = 50; // 和计算相关的50，实际返回10
    this.top_weibos_limit = 20; // 和计算相关的50，实际返回10
    this.max_keywords_size = 50;
    this.min_keywords_size = 2;
    this.pie_title = '情绪饼图';
    this.pie_series_title = '情绪占比';
    this.pie_div_id = 'pie_div';
    this.trend_div_id = 'trend_div';
    this.trend_title = '情绪走势图';
    this.trend_chart;

    this.names = {
        'happy': '积极',
        'angry': '愤怒',
        'sad': '悲伤',
        'news': '新闻'
    }

    this.trend_count_obj = {
        'ts': [], // 时间数组
        'count': {},
        'ratio': {}
    };

    for (var name in this.names){
        this.trend_count_obj['count'][name] = [];
        this.trend_count_obj['ratio'][name] = [];
    }
}

// instance method, 初始化时获取整个时间段的饼图数据并绘制
TrendsLine.prototype.initPullDrawPie = function(){
    that = this;
    var names = this.names;
    var ajax_url = this.pie_ajax_url(this.query, this.end_ts, this.during);
    this.call_async_ajax_request(ajax_url, this.ajax_method, range_count_callback);

    function range_count_callback(data){
        var pie_data = [];
        for (var status in data){
            var count = data[status];
            pie_data.push({
                value: count,
                name: names[status]
            })
        }

        var pie_title = that.pie_title;

        var pie_series_title = that.pie_series_title;

        var legend_data = [];
        for (var name in names){
            legend_data.push(names[name]);
        }

        var pie_div_id = that.pie_div_id;

        refreshDrawPie(pie_data, pie_title, pie_series_title, legend_data, pie_div_id);
    }
}

// 绘制饼图方法
function refreshDrawPie(pie_data, pie_title, pie_series_title, legend_data, pie_div_id) {
    var option = {
        backgroundColor: '#FFF',
        color: ['#11c897', '#fa7256', '#6e87d7', '#b172c5'],
        title : {
            text: '', // pie_title,
            x: 'center',
            textStyle:{
                fontWeight: 'lighter',
                fontSize: 13
            }
        },
        toolbox: {
            show: true,
            feature : {
                mark : {show: true},
                dataView : {show: true, readOnly: false},
                //magicType : {show: true, type: ['line', 'bar']},
                restore : {show: true},
                saveAsImage : {show: true}
            }
        },
        tooltip: {
            trigger: 'item',
            formatter: "{a} <br/>{b} : {c} ({d}%)",
            textStyle: {
                fontWeight: 'bold',
                fontFamily: 'Microsoft YaHei'
            }
        },
        legend: {
            orient:'vertical',
            x : 'left',
            data: legend_data,
            textStyle: {
                fontWeight: 'bold',
                fontFamily: 'Microsoft YaHei'
            }
        },

        calculable : true,
        series : [
            {
                name: pie_series_title,
                type: 'pie',
                radius : '50%',
                center: ['50%', '60%'],
                itemStyle: {
                    normal: {
                        label: {
                            position: 'inner',
                            formatter: "{d}%",
                            textStyle: {
                                fontWeight: 'bold',
                                fontFamily: 'Microsoft YaHei'
                            }
                        },
                        labelLine: {
                            show: false
                        }
                    },
                    emphasis: {
                        label: {
                            show: true,
                            formatter: "{b}\n{d}%",
                            textStyle: {
                                fontWeight: 'bold',
                                fontFamily: 'Microsoft YaHei'
                            }
                        }
                    }
                },
                data: pie_data
            }
        ],
        textStyle: {
            fontWeight: 'bold',
            fontFamily: 'Microsoft YaHei'
        }
    };

    var myChart = echarts.init(document.getElementById(pie_div_id));
    myChart.setOption(option);
}

// instance method, 初始化时获取整个时间范围的关键词云数据并绘制
TrendsLine.prototype.initPullDrawKeywords = function(){
    that = this;

    var names = this.names;

    var min_keywords_size = this.min_keywords_size;
    var max_keywords_size = this.max_keywords_size;

    var emotion = 'global';

    var ajax_url = this.keywords_ajax_url(this.query, this.end_ts, this.during, emotion);
    this.call_async_ajax_request(ajax_url, this.ajax_method, range_keywords_callback);

    function range_keywords_callback(data){
        // console.log(data);
        refreshDrawKeywords(min_keywords_size, max_keywords_size, data, emotion);
    }
}

// 根据权重决定字体大小
function defscale(count, mincount, maxcount, minsize, maxsize){
    if(maxcount == mincount){
        return (maxsize + minsize) * 1.0 / 2
    }else{
        return minsize + 1.0 * (maxsize - minsize) * Math.pow((count / (maxcount - mincount)), 2)
    }
}

// 画关键词云图
function refreshDrawKeywords(min_keywords_size, max_keywords_size, keywords_data, emotion){
    $("#keywords_cloud_div").empty();
    if (keywords_data == {}){
        $("#keywords_cloud_div").append("<a style='font-size:1ex'>关键词云数据为空</a>");
    }
    else{
        var min_count, max_count = 0, words_count_obj = {};
        for (var keyword in keywords_data){
            // 垃圾过滤
            if(keyword in rubbish_words){
                continue;
            }
            var count = keywords_data[keyword];
            if(count > max_count){
                max_count = count;
            }
            if(!min_count){
                min_count = count;
            }
            if(count < min_count){
                min_count = count;
            }
            words_count_obj[keyword] = count;
        }

        var colors = {
            'global': '#666',
            'happy': '#11c897',
            'angry': '#fa7256',
            'sad': '#6e87d7',
            'news': '#b172c5'
        }
        var color = colors[emotion];

        for(var keyword in words_count_obj){
            var count = words_count_obj[keyword];
            var size = defscale(count, min_count, max_count, min_keywords_size, max_keywords_size);
            $('#keywords_cloud_div').append('<a><font style="color:' + color +  '; font-size:' + size + 'px;">' + keyword + '</font></a>');
        }

        on_load();
    }
}

// instance method, 初始化时获取关键微博数据
TrendsLine.prototype.initPullWeibos = function(){
    var names = this.names;

    var weibos_data = [];
    that = this;
    for (var name in names){
        var ajax_url = this.weibos_ajax_url(this.query, this.end_ts, this.during, name, this.top_weibos_limit);
        this.call_sync_ajax_request(ajax_url, this.ajax_method, range_weibos_callback);
    }

    function range_weibos_callback(data){
        // console.log(data);
         // for(var name in names){
            // if(name in data){
                var weibos_list = data;
                that.range_weibos_data= weibos_list;
            // }
        // }
    }
}


function refreshDrawWeibos(select_name, weibos_obj,length){
    var select_name = 'negative';
    // console.log(weibos_obj);
    $("#weibo_list").empty();
    // if (!select_name in weibos_obj){
    //     $("#weibo_list").append('<li class="item">关键微博为空！</li>');
    //     return;
    // }
    var data = weibos_obj[select_name];
    var html = "";
    html += '<div class="tang-scrollpanel-wrapper" style="height: ' + 100* length  + 'px;">';
    html += '<div class="tang-scrollpanel-content">';
    html += '<ul id="weibo_ul">';
    for(var i = 0; i < length; i += 1){
        var da = data[i];
        var  uid = da['_id'];
        var name = da['user_name'];
        // console.log(da['user name']);
        var text = da['content'];
        var clicks_count = da['clicks'];
        var reply_count = da['replies'];
        var lastreply_time = da['lastReplyTime'];
        var releasetime = da['releaseTime'];
        var weibo_link = da['url'];
        var user_link = da['user_url'];
        var user_image_link = da['profile_image_url'];
        // if (user_image_link == 'unknown'){
            user_image_link = '/static/img/unknown_profile_image.gif';
        // }
        html += '<li class="item"><div class="weibo_face"><a target="_blank" href="' + user_link + '">';
        html += '<img src="' + user_image_link + '">';
        html += '</a></div>';
        html += '<div class="weibo_detail">';
        html += '<p><h4>昵称:<a class="undlin" target="_blank" href="' + user_link  + '">' + name + '</a>&nbsp;&nbsp;发布&nbsp;&nbsp;' + text + '</h4></p>';
        html += '<div class="weibo_info">';
        html += '<div class="weibo_pz">';
        html += '<h5>';
        html += '<a class="undlin" href="javascript:;" target="_blank">点击数(' + clicks_count + ')</a>&nbsp;&nbsp;|&nbsp;&nbsp;';
        html += '<a class="undlin" href="javascript:;" target="_blank">回复数(' + reply_count+ ')</a></div>';
        html += '<div class="m">';
         html += '</h5>';
        html += '<h5>';
        html += '<a class="undlin" target="_blank" href="' + weibo_link + '">发表时间' + releasetime + '</a>&nbsp;-&nbsp;';
        html += '<a target="_blank" href="' + weibo_link + '">帖子页面</a>&nbsp;-&nbsp;';
        html += '<a target="_blank" href="' + user_link + '">用户页面</a>';
         html += '</h5>';
        html += '</div>';
        html += '</div>';
        html += '</div>';
        html += '</li>';
    }
    html += '</ul>';
    html += '</div>';
    html += '<div id="TANGRAM_54__slider" class="tang-ui tang-slider tang-slider-vtl" style="height: 100%;">';
    html += '<div id="TANGRAM_56__view" class="tang-view" style="width: 6px;">';
    html += '<div class="tang-content">';
    html += '<div id="TANGRAM_56__inner" class="tang-inner">';
    html += '<div id="TANGRAM_56__process" class="tang-process tang-process-undefined" style="height: 0px;">';
    html += '</div>';
    html += '</div>';
    html += '</div>';
    html += '<a id="TANGRAM_56__knob" href="javascript:;" class="tang-knob" style="top: 0%; left: 0px;"></a>';
    html += '</div>';
    html += '<div class="tang-corner tang-start" id="TANGRAM_54__arrowTop"></div>';
    html += '<div class="tang-corner tang-last" id="TANGRAM_54__arrowBottom"></div>';
    html += '</div>';
    $("#weibo_list").append(html);
}

// instance method, 初始化绘制关键微博列表
TrendsLine.prototype.initDrawWeibos = function(){
    var weibos_obj = this.range_weibos_data;
    var select_name = 'happy';
    var length = 5;
    refreshDrawWeibos(select_name, weibos_obj, length);
    // bindSentimentTabClick(weibos_obj);
    bindmore_weibo(weibos_obj);
}

function bindmore_weibo(weibos_obj){
var length = 5;
var select_sentiment ='';
   $("#more_imformation").unbind();
  // $("#sentimentTabDiv").children("a").each(function() {
  //       var select_a = $(this);
  //       if(select_a.hasClass('curr')) {
  //           select_sentiment = select_a.attr('sentiment');
  //       }
  //   });
  $("#more_imformation").click(function(){	
	length = length + 5;
// console.log(length);
// console.log(weibos_obj);
	if(length > 20){
	   length = weibos_obj[select_sentiment].length;	
	}
        refreshDrawWeibos(select_sentiment, weibos_obj, length);
    });
}

function bindSentimentTabClick(weibos_obj){
    $("#sentimentTabDiv").children("a").unbind();
    var length = 5;
    $("#sentimentTabDiv").children("a").click(function() {
        var select_a = $(this);
        var unselect_a = $(this).siblings('a');
        if(!select_a.hasClass('curr')) {
            select_a.addClass('curr');
            unselect_a.removeClass('curr');
            var select_sentiment = select_a.attr('sentiment');
            refreshDrawWeibos(select_sentiment, weibos_obj, length);
        }
    });
}

// $(document).ready(function(){
//     get_trenddata();
// //  })
// function get_trenddata(){
//     var query = '股票';
//     var during = 900;
//     $.ajax({
//       url: "/guming/sentiment/?query="+ query  + '&during=' + during,
//       dataType : "json",
//       type : 'GET',
//       async: false,
//       success: function(data){
//         console.log(data);
//         // request_callback(data);
//       }  
//   }) ; 
// }
// instance method, 获取数据并绘制趋势图
TrendsLine.prototype.pullDrawTrend = function(){
    var trends_title = this.trend_title;
    var names = this.names;

    var trend_div_id = this.trend_div_id;
    var pointInterval = this.pointInterval;
    var start_ts = this.start_ts;
    var end_ts = this.end_ts;
    var xAxisTitleText = '时间';
    var yAxisTitleText = '数量';
    var series_data = [{
            name: '积极',
            data: [],
            id: 'happy',
            color: '#11c897',
            marker : {
                enabled : false,
            }
        }]

    var that = this;
    myChart = display_trend(that, trend_div_id, this.query, pointInterval, start_ts, end_ts, trends_title, series_data, xAxisTitleText, yAxisTitleText);
    this.trend_chart = myChart;
}

function  pull_line_data(query,during,series,data,ts){
                // var query = '股票';
                // var during = 900;
                // var ts  = 1412937031;
                for (var i = 0 ; i < 12; i ++){
                        $.ajax({
                          url: "/guming/sentiment/?query="+ query  + '&during=' + during+'&ts='+ ts,
                          dataType : "json",
                          type : 'GET',
                          async: false,
                          success: function(data){
                                pull_line_host_data(query,during,series,data,ts);

                         }  
                    }) ; 
                        ts  = ts + i * 900;
                }

           
}

function pull_line_host_data(query,during,series,data,ts){
                // var query = '股票';
                // var during = 900;
                var host_data = data;
                var host_postive_pencnet ;
                var host_negative_pencent;
                var postive_pencent ;
                var negative_pencent ;
                var all_postive_pencent; 
                var all_negative_pencent ;
                var all_count;
                var all_postive_count;
                var all_negative_count ;
                var time;
                $.ajax({
                      url: "/guming/sentiment/?query="+ query  + '&during=' + during+'&stockholder=0'+'&ts='+ ts,
                      dataType : "json",
                      type : 'GET',
                      async: false,
                      success: function(data){

                                all_postive_count = host_data["postive"]+ host_data["postive"];
                                all_negative_count = host_data["negative"] = data["negative"];
                                all_count = all_negative_count + all_postive_count;
                                
                                host_postive_pencnet = host_data['postive']/(host_data["negative"]+host_data["postive"])*1.0;
                                host_negative_pencent = host_data['negative']/(host_data["negative"]+host_data["postive"])*1.0;
                                
                                postive_pencent = data['postive']/(data["negative"]+data["postive"])*1.0;
                                negative_pencent = data['negative']/(data["negative"]+data["postive"])*1.0;

                                all_postive_pencent = all_postive_count/all_count*1.0;
                                all_negative_pencent =  all_negative_count / all_count*1.0;
                                time = new Date(parseInt(ts) * 1000).toLocaleString().replace(/:\d{1,2}$/,' ');
                                
                                series[0].addPoint([ts*1000,all_postive_pencent]);
                                 series[1].addPoint([ts*1000,all_negative_pencent]);
                                 series[2].addPoint([ts*1000,host_postive_pencnet]);
                                 series[3].addPoint([ts*1000,host_negative_pencent]);
                                series[4].addPoint([ts*1000, postive_pencent]);
                                 series[5].addPoint([ts*1000, negative_pencent]);
                           
                     }  
                }) ; 
}

function display_trend(that, trend_div_id, query, during, begin_ts, end_ts, trends_title, series_data, xAxisTitleText, yAxisTitleText){
 
   Highcharts.setOptions({
        global: {
            useUTC: false
        }
    });

    $('#' + trend_div_id).highcharts({

        chart: {
            type: 'spline',// line,
            animation: Highcharts.svg, // don't animate in old IE
            events: {
                load: function() {
                    series = this.series;
                    pull_line_data(query,during,series,end_ts);
                }
            }
        },
        title: {
            text: '',
        },
        subtitle: {
            text: '',
        },
        xAxis: {
            type: 'datetime',
            tickPixelInterval: 150
        },
        yAxis: {
            title: {
                text: ''
            },
            plotLines: [{
                value: 0,
                width: 1,
                color: '#808080'
            }]
        },
        tooltip: {
            valueSuffix: '°C'
        },
        legend: {
	   itemStyle : {
        		'fontSize' : '18px'
           },
            layout: 'vertical',
            align: 'right',
            verticalAlign: 'middle',
            borderWidth: 0
        },
        series: [{
            name: '总量积极',
            data: [],
        }, {
            name: '总量消极',
            data: [],
        },
	 {
            name: '股东积极',
            data: [],
	    visible:false
        },
        {
            name: '股东消极',
            data: [],
	    visible:false
        },
         {
            name: '非股东积极',
            data: [],
        visible:false
        },
        {
            name: '非股东消极',
            data: [],
        visible:false
        }
      ]
    });
}


function call_peak_ajax(that, series, data_list, ts_list, during, emotion){
    var names = that.names;

    var data = [];
    for(var i in data_list){
        data.push(data_list[i][1]);
    }

    var min_keywords_size = that.min_keywords_size;
    var max_keywords_size = that.max_keywords_size;

    var ajax_url = that.peak_ajax_url(data, ts_list, during, emotion);
    var pie_title = that.pie_title;
    var pie_series_title = that.pie_series_title;
    var legend_data = [];
    for (var name in names){
        legend_data.push(names[name]);
    }
    var pie_div_id = that.pie_div_id;

    that.call_async_ajax_request(ajax_url, that.ajax_method, peak_callback);

    function peak_callback(data){
        if ( data != 'Null Data'){
            var isShift = false;
            for(var i in data){
                var x = data[i]['ts'];
                var title = data[i]['title'];
                series.addPoint({'x': x, 'title': title, 'text': title, 'emotion': emotion, 'events': {'click': flagClick}}, true, isShift);
                var flagClick = function(event){
                    var click_ts = this.x / 1000;
                    var emotion = this.emotion;
                    var title = this.title;

                    peakDrawTip(click_ts, emotion, title);
                    peakPullDrawKeywords(click_ts, emotion, title);
                    peakPullDrawPie(click_ts, emotion, title);
                    peakPullDrawWeibos(click_ts, emotion, title);
                }
            }
        }
    }

    function peakDrawTip(click_ts, emotion, title){
        $("#peak_trend_tooltip").empty();
        $("#peak_trend_tooltip").append('<span>当前点击了点' + title + '&nbsp;&nbsp;情绪:' + that.names[emotion] + '&nbsp;&nbsp;日期:' + new Date(click_ts * 1000).format("yyyy年MM月dd日 hh:mm:ss") + '</span>');
        $("#peak_cloudpie_tooltip").empty();
        $("#peak_cloudpie_tooltip").append('<span>当前点击了点' + title + '&nbsp;&nbsp;情绪:' + that.names[emotion] + '&nbsp;&nbsp;日期:' + new Date(click_ts * 1000).format("yyyy年MM月dd日 hh:mm:ss") + '</span>');
        $("#peak_weibo_tooltip").empty();
        $("#peak_weibo_tooltip").append('<span>当前点击了点' + title + '&nbsp;&nbsp;情绪:' + that.names[emotion] + '&nbsp;&nbsp;日期:' + new Date(click_ts * 1000).format("yyyy年MM月dd日 hh:mm:ss") + '</span>');
    }

    function peakPullDrawKeywords(click_ts, emotion, title){
        var ajax_url = that.keywords_ajax_url(that.query, click_ts, that.pointInterval, emotion);
        that.call_async_ajax_request(ajax_url, that.ajax_method, callback);
        function callback(data){
            refreshDrawKeywords(min_keywords_size, max_keywords_size, data[emotion], emotion);
        }
    }

    function peakPullDrawPie(click_ts, emotion, title){
        var ajax_url = that.pie_ajax_url(that.query, click_ts, that.pointInterval);
        that.call_async_ajax_request(ajax_url, that.ajax_method, callback);
        function callback(data){
            var pie_data = [];
            for (var status in data){
                var count = data[status];
                pie_data.push({
                    value: count,
                    name: names[status]
                })
            }
            refreshDrawPie(pie_data, pie_title, pie_series_title, legend_data, pie_div_id);
        }
    }

    function peakPullDrawWeibos(click_ts, emotion, title){
        var ajax_url = that.weibos_ajax_url(that.query, click_ts, that.pointInterval, 'global', that.top_weibos_limit);
        that.call_async_ajax_request(ajax_url, that.ajax_method, callback);
        function callback(data){
            refreshWeiboTab(emotion);
            refreshDrawWeibos(emotion, data);
            bindSentimentTabClick(data);
        }
    }

    function refreshWeiboTab(emotion){
        $("#sentimentTabDiv").children("a").each(function() {
            var select_a = $(this);
            var select_a_sentiment = select_a.attr('sentiment');
            if (select_a_sentiment == emotion){
                if(!select_a.hasClass('curr')) {
                    select_a.addClass('curr');
                }
            }
            else{
                if(select_a.hasClass('curr')) {
                    select_a.removeClass('curr');
                }
            }
        });
    }
}

function get_peaks(that, series, data_obj, ts_list, during){
    var names = that.names;
    for (var name in names){
        var select_series = series[name];
        var data_list = data_obj[name];
        call_peak_ajax(that, select_series, data_list, ts_list, during, name);
    }
}

//(function keywords_cloud_load(){
    var radius = 85;
    var dtr = Math.PI/180;
    var d=300;

    var mcList = [];
    var active = false;
    var lasta = 1;
    var lastb = 1;
    var distr = true;
    var tspeed=2;
    var size=250;

    var mouseX=0;
    var mouseY=0;

    var howElliptical=1;

    var aA=null;
    var oDiv=null;
    function on_load()
    {
        var i=0;
        var oTag=null;
        mcList = [];

        oDiv=document.getElementById('keywords_cloud_div');

        aA=oDiv.getElementsByTagName('a');

        for(i=0;i<aA.length;i++)
        {
            oTag={};

            oTag.offsetWidth=aA[i].offsetWidth;
            oTag.offsetHeight=aA[i].offsetHeight;

            mcList.push(oTag);
        }

        sineCosine( 0,0,0 );

        positionAll();

        oDiv.onmouseover=function ()
        {
            active=true;
        };

        oDiv.onmouseout=function ()
        {
            active=false;
        };

        oDiv.onmousemove=function (ev)
        {
            var oEvent=window.event || ev;

            mouseX=oEvent.clientX-(oDiv.offsetLeft+oDiv.offsetWidth/2);
            mouseY=oEvent.clientY-(oDiv.offsetTop+oDiv.offsetHeight/2);

            mouseX/=5;
            mouseY/=5;
        };

        setInterval(update, 30);
    };

    function update()
    {
        var a;
        var b;

        if(active)
        {
            a = (-Math.min( Math.max( -mouseY, -size ), size ) / radius ) * tspeed;
            b = (Math.min( Math.max( -mouseX, -size ), size ) / radius ) * tspeed;
        }
        else
        {
            a = lasta * 0.98;
            b = lastb * 0.98;
        }

        lasta=a;
        lastb=b;

        if(Math.abs(a)<=0.01 && Math.abs(b)<=0.01)
        {
            return;
        }

        var c=0;
        sineCosine(a,b,c);
        for(var j=0;j<mcList.length;j++)
        {
            var rx1=mcList[j].cx;
            var ry1=mcList[j].cy*ca+mcList[j].cz*(-sa);
            var rz1=mcList[j].cy*sa+mcList[j].cz*ca;

            var rx2=rx1*cb+rz1*sb;
            var ry2=ry1;
            var rz2=rx1*(-sb)+rz1*cb;

            var rx3=rx2*cc+ry2*(-sc);
            var ry3=rx2*sc+ry2*cc;
            var rz3=rz2;

            mcList[j].cx=rx3;
            mcList[j].cy=ry3;
            mcList[j].cz=rz3;

            per=d/(d+rz3);

            mcList[j].x=(howElliptical*rx3*per)-(howElliptical*2);
            mcList[j].y=ry3*per;
            mcList[j].scale=per;
            mcList[j].alpha=per;

            mcList[j].alpha=(mcList[j].alpha-0.6)*(10/6);
        }

        doPosition();
        depthSort();
    }

    function depthSort()
    {
        var i=0;
        var aTmp=[];

        for(i=0;i<aA.length;i++)
        {
            aTmp.push(aA[i]);
        }

        aTmp.sort
        (
            function (vItem1, vItem2)
            {
                if(vItem1.cz>vItem2.cz)
                {
                    return -1;
                }
                else if(vItem1.cz<vItem2.cz)
                {
                    return 1;
                }
                else
                {
                    return 0;
                }
            }
        );

        for(i=0;i<aTmp.length;i++)
        {
            aTmp[i].style.zIndex=i;
        }
    }

    function positionAll()
    {
        var phi=0;
        var theta=0;
        var max=mcList.length;

        var i=0;
        var aTmp=[];
        var oFragment=document.createDocumentFragment();

        //随机排序
        for(i=0;i<aA.length;i++)
        {
            aTmp.push(aA[i]);
        }

        aTmp.sort
        (
            function ()
            {
                return Math.random()<0.5?1:-1;
            }
        );

        for(i=0;i<aTmp.length;i++)
        {
            oFragment.appendChild(aTmp[i]);
        }

        oDiv.appendChild(oFragment);

        for( var i=1; i<max+1; i++){
            if( distr )
            {
                phi = Math.acos(-1+(2*i-1)/max);
                theta = Math.sqrt(max*Math.PI)*phi;
            }
            else
            {
                phi = Math.random()*(Math.PI);
                theta = Math.random()*(2*Math.PI);
            }

            //坐标变换
            mcList[i-1].cx = radius * Math.cos(theta)*Math.sin(phi);
            mcList[i-1].cy = radius * Math.sin(theta)*Math.sin(phi);
            mcList[i-1].cz = radius * Math.cos(phi);

            aA[i-1].style.left=mcList[i-1].cx+oDiv.offsetWidth/2-mcList[i-1].offsetWidth/2+'px';
            aA[i-1].style.top=mcList[i-1].cy+oDiv.offsetHeight/2-mcList[i-1].offsetHeight/2+'px';
        }
    }

    function doPosition()
    {
        var l=oDiv.offsetWidth/2;
        var t=oDiv.offsetHeight/2;
        for(var i=0;i<mcList.length;i++)
        {
            aA[i].style.left=mcList[i].cx+l-mcList[i].offsetWidth/2+'px';
            aA[i].style.top=mcList[i].cy+t-mcList[i].offsetHeight/2+'px';

            aA[i].style.ontSize=Math.ceil(12*mcList[i].scale/2)+8+'px';

            aA[i].style.filter="alpha(opacity="+100*mcList[i].alpha+")";
            aA[i].style.opacity=mcList[i].alpha;
        }
    }

    function sineCosine( a, b, c)
    {
        sa = Math.sin(a * dtr);
        ca = Math.cos(a * dtr);
        sb = Math.sin(b * dtr);
        cb = Math.cos(b * dtr);
        sc = Math.sin(c * dtr);
        cc = Math.cos(c * dtr);
    }
//})();


var START_TS = 1378051200;
var END_TS = 1412937031;
var POINT_INTERVAL = 900;
var QUERY = "股票";


tl = new TrendsLine(QUERY, START_TS, END_TS, POINT_INTERVAL)
tl.pullDrawTrend();
tl.initPullDrawPie();
tl.initPullDrawKeywords();
tl.initPullWeibos();
tl.initDrawWeibos();

