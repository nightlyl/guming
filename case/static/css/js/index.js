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
// var topic = QUERY; 
// var curr = {};
// var index_time = [];
function TrendsLine(query, start_ts, end_ts, pointInterval){
    //instance property
    this.query = query;
    this.start_ts = start_ts; // 开始时间戳
    this.end_ts = end_ts; // 终止时间戳
    this.pointInterval = pointInterval; // 图上一点的时间间隔
    this.during = end_ts - start_ts; // 整个时间范围
    this.pie_ajax_url = function(query, end_ts, during){
        return "/guming/stock_pie_count/?&query=" + query + "&during=" + during  + "&topk=" + topk;
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


$(document).ready(function(){
    getpie_indexdata();
    draw_index1();
    draw_pie();

 })



TrendsLine.prototype.initPullWeibos = function(){
    var names = this.names;

    var weibos_data = [];
    that = this;
    for (var name in names){
        var ajax_url = this.weibos_ajax_url(this.query, this.end_ts, this.during, name, this.top_weibos_limit);
        this.call_sync_ajax_request(ajax_url, this.ajax_method, range_weibos_callback);
    }

    function range_weibos_callback(data){
        console.log(data);
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
    console.log(weibos_obj);
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
/// instance method, 初始化绘制关键微博列表
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
console.log(length);
console.log(weibos_obj);
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


function  getpie_indexdata(){
        $.ajax({
      url: "/guming/stock_pie_count/?query="+ query  + '&topk=' + topk + '&during=' + during + '&ts=' + ts,
      dataType : "json",
      type : 'GET',
      async: false,
      success: function(data){
        console.log(data);
        request_callback(data);
      }  
  }) ; 
}
 var negative_percent = [];
 var stock_name = [];
function request_callback(data){
        var value = [];
        var total = 0;
        var percentage = [];
        var negative = [];      
    for (var i = 0; i < data.length ;i++) {

        stock_name.push(data[i][0]);
        value.push(data[i][1]);
        negative.push(data[i][2]);
        negative_percent.push((data[i][2]/data[i][1]).toFixed(2));
    }
    // console.log(name);
    // console.log(value);
    for (var i = 0; i < value.length ;i++) {
         total += value[i];
    }
    for (var i = 0; i < stock_name.length ;i++) {
         percentage.push((value[i]/total).toFixed(2));
    }
  
    draw_pie(percentage,stock_name);
    draw_index1(stock_name,negative_percent);
}
    var i = 1;
function drawpicture1(){    
    i ++;
    getpie_indexdata();
    // console.log(i);
    if (i ==1 ){
      draw_index1(stock_name,negative_percent);
    }
    else if (i ==2 ){
      draw_index2(stock_name,negative_percent);
    }
    else if(i == 3){
      draw_index3(stock_name,negative_percent);
    }
    else if(i == 4){
      draw_index4(stock_name,negative_percent);
    }
    else if(i == 5){
      draw_index5(stock_name,negative_percent);
    }
    else{
         draw_index5(stock_name,negative_percent);
        alert("超出范围");
     
        i --;
    }
}
function drawpicture2(){ 
    getpie_indexdata();
    i --;
    console.log(i);
    if (i ==1 ){
      draw_index1(stock_name,negative_percent);
    }
    else if (i ==2 ){
      draw_index2(stock_name,negative_percent);
    }
    else if(i == 3){
      draw_index3(stock_name,negative_percent);
    }
    else if(i == 4){
      draw_index4(stock_name,negative_percent);
    }
    else if(i == 5){
      draw_index5(stock_name,negative_percent);
    }
    else{
        draw_index1(stock_name,negative_percent);
        alert("超出范围");
      
        i ++;
    }
}
function draw_pie(percentage,stock_name){
    var pie_data=[];
        pie_data = [{value:  percentage[0], name:stock_name[0]},{value:  percentage[1], name:stock_name[1]},
                    {value:  percentage[2], name:stock_name[2]},{value:  percentage[3], name:stock_name[3]},
                    {value:  percentage[4], name:stock_name[4]},{value:  percentage[5], name:stock_name[5]},
                    {value:  percentage[6], name:stock_name[6]},{value:  percentage[7], name:stock_name[7]},
                    {value:  percentage[8], name:stock_name[8]},{value:  percentage[9], name:stock_name[9]}];

  option = {
        title : {
            text: '',
            x:'center',
            textStyle:{
            fontWeight:'lighter',
            fontSize: 14,
            }        
        },
    tooltip : {
        trigger: 'item',
        formatter: "{a} <br/>{b} : {c} ({d}%)"
    },
    calculable : true,
    series : [
        {
            name:'',
            type:'pie',
            radius : '45%',
            center: ['50%', '50%'],
            data:pie_data
        }
    ]
};
    var myChart = echarts.init(document.getElementById('pie'));
    myChart.setOption(option);
}

function draw_index1(stock_name,negative_percent){     
        // var value = curr["last_index"].toFixed(3)*100;
        // var index_data = [{value: value, name: '舆情指数'}];
    var labelTop = {
        normal : {
            label : {
                show : true,
                position : 'center',
                textStyle: {
                    baseline : 'bottom'
                }
            },
            labelLine : {
                show : false
            }
        }
    };
    var labelBottom = {
        normal : {
            color: '#ccc',
            label : {
                show : true,
                position : 'center',
                formatter : function (a,b,c){return 100 - c + '%'},
                textStyle: {
                    baseline : 'top'
                }
            },
            labelLine : {
                show : false
            }
        },
        emphasis: {
            color: 'rgba(0,0,0,0)'
        }
    };
    var radius = [45, 60];
    var option = {
        tooltip: {
            formatter: "{a} <br/>{b} : {c}%"
        },
        title : {
            text: '',
            x:'center',
            textStyle:{
            fontWeight:'lighter',
            fontSize: 14,
            }        
        },
        series : [
            {
                name:stock_name[0],
                type:'gauge',
                center : ['35%', '50%'],    // 默认全局居中
                radius : radius,
                startAngle: 140,
                endAngle : -140,
                min: 0,                     // 最小值
                max: 100,                   // 最大值
                precision: 0,               // 小数精度，默认为0，无小数点
                splitNumber: 10,             // 分割段数，默认为5
                axisLine: {            // 坐标轴线
                    show: true,        // 默认显示，属性show控制显示与否
                    lineStyle: {       // 属性lineStyle控制线条样式
                        color: [[0.2, 'lightgreen'],[0.4, 'orange'],[0.8, 'skyblue'],[1, '#ff4500']], //划分区域，对不同的指标可以修改预警的数值范围
                        width: 15
                    }
                },
                axisTick: {            // 坐标轴小标记
                    show: true,        // 属性show控制显示与否，默认不显示
                    splitNumber: 5,    // 每份split细分多少段
                    length :5,         // 属性length控制线长
                    lineStyle: {       // 属性lineStyle控制线条样式
                        color: '#eee',
                        width: 1,
                        type: 'solid'
                    }
                },
                axisLabel: {           // 坐标轴文本标签，详见axis.axisLabel
                    show: true,
                    formatter: function(v){
                        switch (v+''){
                            case '10': return '弱';
                            case '30': return '低';
                            case '60': return '中';
                            case '90': return '高';
                            default: return '';
                        }
                    },
                    textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                        color: '#320',
                        fontSize : 10
                    }
                },
                splitLine: {           // 分隔线
                    show: true,        // 默认显示，属性show控制显示与否
                    length :10,         // 属性length控制线长
                    lineStyle: {       // 属性lineStyle（详见lineStyle）控制线条样式
                        color: '#eee',
                        width: 2,
                        type: 'solid'
                    }
                },
                pointer : {
                    length : '80%',
                    width : 8,
                    color : 'auto'
                },
                title : {
                    show : true,
                    offsetCenter: ['-80%', -5],       // x, y，单位px
                    textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                        color: '#333',
                        fontSize : 15,
                        fontWeight: 'bolder'
                    }
                },
                detail : {
                    show : true,
                    backgroundColor: 'rgba(0,0,0,0)',
                    borderWidth: 0,
                    borderColor: '#ccc',
                    width: 100,
                    height: 40,
                    offsetCenter: ['-80%', -2],       // x, y，单位px
                    formatter:'{value}%',
                    textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                        color: 'red',
                        fontSize : 15,
                        fontWeight: 'bolder'
                    }
                },
                data:[{value: negative_percent[0]*100, name: stock_name[0]}]
            },
            {
                name:stock_name[1],
                type:'gauge',
                center : ['70%', '50%'],    // 默认全局居中
                radius : radius,
                startAngle: 140,
                endAngle : -140,
                min: 0,                     // 最小值
                max: 100,                   // 最大值
                precision: 0,               // 小数精度，默认为0，无小数点
                splitNumber: 10,             // 分割段数，默认为5
                axisLine: {            // 坐标轴线
                    show: true,        // 默认显示，属性show控制显示与否
                    lineStyle: {       // 属性lineStyle控制线条样式
                        color: [[0.2, 'lightgreen'],[0.4, 'orange'],[0.8, 'skyblue'],[1, '#ff4500']], //划分区域，对不同的指标可以修改预警的数值范围
                        width: 15
                    }
                },
                axisTick: {            // 坐标轴小标记
                    show: true,        // 属性show控制显示与否，默认不显示
                    splitNumber: 5,    // 每份split细分多少段
                    length :5,         // 属性length控制线长
                    lineStyle: {       // 属性lineStyle控制线条样式
                        color: '#eee',
                        width: 1,
                        type: 'solid'
                    }
                },
                axisLabel: {           // 坐标轴文本标签，详见axis.axisLabel
                    show: true,
                    formatter: function(v){
                        switch (v+''){
                            case '10': return '弱';
                            case '30': return '低';
                            case '60': return '中';
                            case '90': return '高';
                            default: return '';
                        }
                    },
                    textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                        color: '#320',
                        fontSize : 10
                    }
                },
                splitLine: {           // 分隔线
                    show: true,        // 默认显示，属性show控制显示与否
                    length :10,         // 属性length控制线长
                    lineStyle: {       // 属性lineStyle（详见lineStyle）控制线条样式
                        color: '#eee',
                        width: 2,
                        type: 'solid'
                    }
                },
                pointer : {
                    length : '80%',
                    width : 8,
                    color : 'auto'
                },
                title : {
                    show : true,
                    offsetCenter: ['-80%', -5],       // x, y，单位px
                    textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                        color: '#333',
                        fontSize : 15,
                        fontWeight: 'bolder'
                    }
                },
                detail : {
                    show : true,
                    backgroundColor: 'rgba(0,0,0,0)',
                    borderWidth: 0,
                    borderColor: '#ccc',
                    width: 100,
                    height: 40,
                    offsetCenter: ['-80%', -2],       // x, y，单位px
                    formatter:'{value}%',
                    textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                        color: 'red',
                        fontSize : 15,
                        fontWeight: 'bolder'
                    }
                },
                data:[{value: negative_percent[1]*100, name: stock_name[1]}]
            }
        ]
    };
    var myChart = echarts.init(document.getElementById('index'));
    myChart.setOption(option);
}
function draw_index2(stock_name,negative_percent){     
    var labelTop = {
        normal : {
            label : {
                show : true,
                position : 'center',
                textStyle: {
                    baseline : 'bottom'
                }
            },
            labelLine : {
                show : false
            }
        }
    };
    var labelBottom = {
        normal : {
            color: '#ccc',
            label : {
                show : true,
                position : 'center',
                formatter : function (a,b,c){return 100 - c + '%'},
                textStyle: {
                    baseline : 'top'
                }
            },
            labelLine : {
                show : false
            }
        },
        emphasis: {
            color: 'rgba(0,0,0,0)'
        }
    };
    var radius = [45, 60];
    var option = {
        tooltip: {
            formatter: "{a} <br/>{b} : {c}%"
        },
        title : {
            text: '',
            x: 'center'
        },
        series : [
            {
                name:stock_name[2],
                type:'gauge',
                center : ['35%', '50%'],    // 默认全局居中
                radius : radius,
                startAngle: 140,
                endAngle : -140,
                min: 0,                     // 最小值
                max: 100,                   // 最大值
                precision: 0,               // 小数精度，默认为0，无小数点
                splitNumber: 10,             // 分割段数，默认为5
                axisLine: {            // 坐标轴线
                    show: true,        // 默认显示，属性show控制显示与否
                    lineStyle: {       // 属性lineStyle控制线条样式
                        color: [[0.2, 'lightgreen'],[0.4, 'orange'],[0.8, 'skyblue'],[1, '#ff4500']], //划分区域，对不同的指标可以修改预警的数值范围
                        width: 15
                    }
                },
                axisTick: {            // 坐标轴小标记
                    show: true,        // 属性show控制显示与否，默认不显示
                    splitNumber: 5,    // 每份split细分多少段
                    length :5,         // 属性length控制线长
                    lineStyle: {       // 属性lineStyle控制线条样式
                        color: '#eee',
                        width: 1,
                        type: 'solid'
                    }
                },
                axisLabel: {           // 坐标轴文本标签，详见axis.axisLabel
                    show: true,
                    formatter: function(v){
                        switch (v+''){
                            case '10': return '弱';
                            case '30': return '低';
                            case '60': return '中';
                            case '90': return '高';
                            default: return '';
                        }
                    },
                    textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                        color: '#320',
                        fontSize : 10
                    }
                },
                splitLine: {           // 分隔线
                    show: true,        // 默认显示，属性show控制显示与否
                    length :10,         // 属性length控制线长
                    lineStyle: {       // 属性lineStyle（详见lineStyle）控制线条样式
                        color: '#eee',
                        width: 2,
                        type: 'solid'
                    }
                },
                pointer : {
                    length : '80%',
                    width : 8,
                    color : 'auto'
                },
                title : {
                    show : true,
                    offsetCenter: ['-80%', -5],       // x, y，单位px
                    textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                        color: '#333',
                        fontSize : 15,
                        fontWeight: 'bolder'
                    }
                },
                detail : {
                    show : true,
                    backgroundColor: 'rgba(0,0,0,0)',
                    borderWidth: 0,
                    borderColor: '#ccc',
                    width: 100,
                    height: 40,
                    offsetCenter: ['-80%', -2],       // x, y，单位px
                    formatter:'{value}%',
                    textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                        color: 'red',
                        fontSize : 15,
                        fontWeight: 'bolder'
                    }
                },
                data:[{value: negative_percent[2]*100, name: stock_name[2]}]
            },
            {
                name:stock_name[3],
                type:'gauge',
                center : ['70%', '50%'],    // 默认全局居中
                radius : radius,
                startAngle: 140,
                endAngle : -140,
                min: 0,                     // 最小值
                max: 100,                   // 最大值
                precision: 0,               // 小数精度，默认为0，无小数点
                splitNumber: 10,             // 分割段数，默认为5
                axisLine: {            // 坐标轴线
                    show: true,        // 默认显示，属性show控制显示与否
                    lineStyle: {       // 属性lineStyle控制线条样式
                        color: [[0.2, 'lightgreen'],[0.4, 'orange'],[0.8, 'skyblue'],[1, '#ff4500']], //划分区域，对不同的指标可以修改预警的数值范围
                        width: 15
                    }
                },
                axisTick: {            // 坐标轴小标记
                    show: true,        // 属性show控制显示与否，默认不显示
                    splitNumber: 5,    // 每份split细分多少段
                    length :5,         // 属性length控制线长
                    lineStyle: {       // 属性lineStyle控制线条样式
                        color: '#eee',
                        width: 1,
                        type: 'solid'
                    }
                },
                axisLabel: {           // 坐标轴文本标签，详见axis.axisLabel
                    show: true,
                    formatter: function(v){
                        switch (v+''){
                            case '10': return '弱';
                            case '30': return '低';
                            case '60': return '中';
                            case '90': return '高';
                            default: return '';
                        }
                    },
                    textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                        color: '#320',
                        fontSize : 10
                    }
                },
                splitLine: {           // 分隔线
                    show: true,        // 默认显示，属性show控制显示与否
                    length :10,         // 属性length控制线长
                    lineStyle: {       // 属性lineStyle（详见lineStyle）控制线条样式
                        color: '#eee',
                        width: 2,
                        type: 'solid'
                    }
                },
                pointer : {
                    length : '80%',
                    width : 8,
                    color : 'auto'
                },
                title : {
                    show : true,
                    offsetCenter: ['-80%', -5],       // x, y，单位px
                    textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                        color: '#333',
                        fontSize : 15,
                        fontWeight: 'bolder'
                    }
                },
                detail : {
                    show : true,
                    backgroundColor: 'rgba(0,0,0,0)',
                    borderWidth: 0,
                    borderColor: '#ccc',
                    width: 100,
                    height: 40,
                    offsetCenter: ['-80%', -2],       // x, y，单位px
                    formatter:'{value}%',
                    textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                        color: 'red',
                        fontSize : 15,
                        fontWeight: 'bolder'
                    }
                },
                data:[{value: negative_percent[3]*100, name: stock_name[3]}]
            }
        ]
    };
    var myChart = echarts.init(document.getElementById('index'));
    myChart.setOption(option);
}
function draw_index3(stock_name,negative_percent){     
    var labelTop = {
        normal : {
            label : {
                show : true,
                position : 'center',
                textStyle: {
                    baseline : 'bottom'
                }
            },
            labelLine : {
                show : false
            }
        }
    };
    var labelBottom = {
        normal : {
            color: '#ccc',
            label : {
                show : true,
                position : 'center',
                formatter : function (a,b,c){return 100 - c + '%'},
                textStyle: {
                    baseline : 'top'
                }
            },
            labelLine : {
                show : false
            }
        },
        emphasis: {
            color: 'rgba(0,0,0,0)'
        }
    };
    var radius = [45, 60];
    var option = {
        tooltip: {
            formatter: "{a} <br/>{b} : {c}%"
        },
        title : {
            text: '',
            x: 'center'
        },
        series : [
            {
                name:stock_name[4],
                type:'gauge',
                center : ['35%', '50%'],    // 默认全局居中
                radius : radius,
                startAngle: 140,
                endAngle : -140,
                min: 0,                     // 最小值
                max: 100,                   // 最大值
                precision: 0,               // 小数精度，默认为0，无小数点
                splitNumber: 10,             // 分割段数，默认为5
                axisLine: {            // 坐标轴线
                    show: true,        // 默认显示，属性show控制显示与否
                    lineStyle: {       // 属性lineStyle控制线条样式
                        color: [[0.2, 'lightgreen'],[0.4, 'orange'],[0.8, 'skyblue'],[1, '#ff4500']], //划分区域，对不同的指标可以修改预警的数值范围
                        width: 15
                    }
                },
                axisTick: {            // 坐标轴小标记
                    show: true,        // 属性show控制显示与否，默认不显示
                    splitNumber: 5,    // 每份split细分多少段
                    length :5,         // 属性length控制线长
                    lineStyle: {       // 属性lineStyle控制线条样式
                        color: '#eee',
                        width: 1,
                        type: 'solid'
                    }
                },
                axisLabel: {           // 坐标轴文本标签，详见axis.axisLabel
                    show: true,
                    formatter: function(v){
                        switch (v+''){
                            case '10': return '弱';
                            case '30': return '低';
                            case '60': return '中';
                            case '90': return '高';
                            default: return '';
                        }
                    },
                    textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                        color: '#320',
                        fontSize : 10
                    }
                },
                splitLine: {           // 分隔线
                    show: true,        // 默认显示，属性show控制显示与否
                    length :10,         // 属性length控制线长
                    lineStyle: {       // 属性lineStyle（详见lineStyle）控制线条样式
                        color: '#eee',
                        width: 2,
                        type: 'solid'
                    }
                },
                pointer : {
                    length : '80%',
                    width : 8,
                    color : 'auto'
                },
                title : {
                    show : true,
                    offsetCenter: ['-80%', -5],       // x, y，单位px
                    textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                        color: '#333',
                        fontSize : 15,
                        fontWeight: 'bolder'
                    }
                },
                detail : {
                    show : true,
                    backgroundColor: 'rgba(0,0,0,0)',
                    borderWidth: 0,
                    borderColor: '#ccc',
                    width: 100,
                    height: 40,
                    offsetCenter: ['-80%', -2],       // x, y，单位px
                    formatter:'{value}%',
                    textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                        color: 'red',
                        fontSize : 15,
                        fontWeight: 'bolder'
                    }
                },
                data:[{value: negative_percent[4]*100 ,name:stock_name[4]}]
            },
            {
                name:stock_name[5],
                type:'gauge',
                center : ['70%', '50%'],    // 默认全局居中
                radius : radius,
                startAngle: 140,
                endAngle : -140,
                min: 0,                     // 最小值
                max: 100,                   // 最大值
                precision: 0,               // 小数精度，默认为0，无小数点
                splitNumber: 10,             // 分割段数，默认为5
                axisLine: {            // 坐标轴线
                    show: true,        // 默认显示，属性show控制显示与否
                    lineStyle: {       // 属性lineStyle控制线条样式
                        color: [[0.2, 'lightgreen'],[0.4, 'orange'],[0.8, 'skyblue'],[1, '#ff4500']], //划分区域，对不同的指标可以修改预警的数值范围
                        width: 15
                    }
                },
                axisTick: {            // 坐标轴小标记
                    show: true,        // 属性show控制显示与否，默认不显示
                    splitNumber: 5,    // 每份split细分多少段
                    length :5,         // 属性length控制线长
                    lineStyle: {       // 属性lineStyle控制线条样式
                        color: '#eee',
                        width: 1,
                        type: 'solid'
                    }
                },
                axisLabel: {           // 坐标轴文本标签，详见axis.axisLabel
                    show: true,
                    formatter: function(v){
                        switch (v+''){
                            case '10': return '弱';
                            case '30': return '低';
                            case '60': return '中';
                            case '90': return '高';
                            default: return '';
                        }
                    },
                    textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                        color: '#320',
                        fontSize : 10
                    }
                },
                splitLine: {           // 分隔线
                    show: true,        // 默认显示，属性show控制显示与否
                    length :10,         // 属性length控制线长
                    lineStyle: {       // 属性lineStyle（详见lineStyle）控制线条样式
                        color: '#eee',
                        width: 2,
                        type: 'solid'
                    }
                },
                pointer : {
                    length : '80%',
                    width : 8,
                    color : 'auto'
                },
                title : {
                    show : true,
                    offsetCenter: ['-80%', -5],       // x, y，单位px
                    textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                        color: '#333',
                        fontSize : 15,
                        fontWeight: 'bolder'
                    }
                },
                detail : {
                    show : true,
                    backgroundColor: 'rgba(0,0,0,0)',
                    borderWidth: 0,
                    borderColor: '#ccc',
                    width: 100,
                    height: 40,
                    offsetCenter: ['-80%', -2],       // x, y，单位px
                    formatter:'{value}%',
                    textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                        color: 'red',
                        fontSize : 15,
                        fontWeight: 'bolder'
                    }
                },
                data:[{value: negative_percent[5]*100, name:stock_name[5]}]
            }
        ]
    };
    var myChart = echarts.init(document.getElementById('index'));
    myChart.setOption(option);
}
function draw_index4(stock_name,negative_percent){     
        var labelTop = {
        normal : {
            label : {
                show : true,
                position : 'center',
                textStyle: {
                    baseline : 'bottom'
                }
            },
            labelLine : {
                show : false
            }
        }
    };
    var labelBottom = {
        normal : {
            color: '#ccc',
            label : {
                show : true,
                position : 'center',
                formatter : function (a,b,c){return 100 - c + '%'},
                textStyle: {
                    baseline : 'top'
                }
            },
            labelLine : {
                show : false
            }
        },
        emphasis: {
            color: 'rgba(0,0,0,0)'
        }
    };
    var radius = [45, 60];
    var option = {
        tooltip: {
            formatter: "{a} <br/>{b} : {c}%"
        },
        title : {
            text: '',
            x: 'center'
        },
        series : [
            {
                name:stock_name[6],
                type:'gauge',
                center : ['35%', '50%'],    // 默认全局居中
                radius : radius,
                startAngle: 140,
                endAngle : -140,
                min: 0,                     // 最小值
                max: 100,                   // 最大值
                precision: 0,               // 小数精度，默认为0，无小数点
                splitNumber: 10,             // 分割段数，默认为5
                axisLine: {            // 坐标轴线
                    show: true,        // 默认显示，属性show控制显示与否
                    lineStyle: {       // 属性lineStyle控制线条样式
                        color: [[0.2, 'lightgreen'],[0.4, 'orange'],[0.8, 'skyblue'],[1, '#ff4500']], //划分区域，对不同的指标可以修改预警的数值范围
                        width: 15
                    }
                },
                axisTick: {            // 坐标轴小标记
                    show: true,        // 属性show控制显示与否，默认不显示
                    splitNumber: 5,    // 每份split细分多少段
                    length :5,         // 属性length控制线长
                    lineStyle: {       // 属性lineStyle控制线条样式
                        color: '#eee',
                        width: 1,
                        type: 'solid'
                    }
                },
                axisLabel: {           // 坐标轴文本标签，详见axis.axisLabel
                    show: true,
                    formatter: function(v){
                        switch (v+''){
                            case '10': return '弱';
                            case '30': return '低';
                            case '60': return '中';
                            case '90': return '高';
                            default: return '';
                        }
                    },
                    textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                        color: '#320',
                        fontSize : 10
                    }
                },
                splitLine: {           // 分隔线
                    show: true,        // 默认显示，属性show控制显示与否
                    length :10,         // 属性length控制线长
                    lineStyle: {       // 属性lineStyle（详见lineStyle）控制线条样式
                        color: '#eee',
                        width: 2,
                        type: 'solid'
                    }
                },
                pointer : {
                    length : '80%',
                    width : 8,
                    color : 'auto'
                },
                title : {
                    show : true,
                    offsetCenter: ['-80%', -5],       // x, y，单位px
                    textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                        color: '#333',
                        fontSize : 15,
                        fontWeight: 'bolder'
                    }
                },
                detail : {
                    show : true,
                    backgroundColor: 'rgba(0,0,0,0)',
                    borderWidth: 0,
                    borderColor: '#ccc',
                    width: 100,
                    height: 40,
                    offsetCenter: ['-80%', -2],       // x, y，单位px
                    formatter:'{value}%',
                    textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                        color: 'red',
                        fontSize : 15,
                        fontWeight: 'bolder'
                    }
                },
                data:[{value: negative_percent[6]*100, name:stock_name[6]}]
            },
            {
                name:stock_name[7],
                type:'gauge',
                center : ['70%', '50%'],    // 默认全局居中
                radius : radius,
                startAngle: 140,
                endAngle : -140,
                min: 0,                     // 最小值
                max: 100,                   // 最大值
                precision: 0,               // 小数精度，默认为0，无小数点
                splitNumber: 10,             // 分割段数，默认为5
                axisLine: {            // 坐标轴线
                    show: true,        // 默认显示，属性show控制显示与否
                    lineStyle: {       // 属性lineStyle控制线条样式
                        color: [[0.2, 'lightgreen'],[0.4, 'orange'],[0.8, 'skyblue'],[1, '#ff4500']], //划分区域，对不同的指标可以修改预警的数值范围
                        width: 15
                    }
                },
                axisTick: {            // 坐标轴小标记
                    show: true,        // 属性show控制显示与否，默认不显示
                    splitNumber: 5,    // 每份split细分多少段
                    length :5,         // 属性length控制线长
                    lineStyle: {       // 属性lineStyle控制线条样式
                        color: '#eee',
                        width: 1,
                        type: 'solid'
                    }
                },
                axisLabel: {           // 坐标轴文本标签，详见axis.axisLabel
                    show: true,
                    formatter: function(v){
                        switch (v+''){
                            case '10': return '弱';
                            case '30': return '低';
                            case '60': return '中';
                            case '90': return '高';
                            default: return '';
                        }
                    },
                    textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                        color: '#320',
                        fontSize : 10
                    }
                },
                splitLine: {           // 分隔线
                    show: true,        // 默认显示，属性show控制显示与否
                    length :10,         // 属性length控制线长
                    lineStyle: {       // 属性lineStyle（详见lineStyle）控制线条样式
                        color: '#eee',
                        width: 2,
                        type: 'solid'
                    }
                },
                pointer : {
                    length : '80%',
                    width : 8,
                    color : 'auto'
                },
                title : {
                    show : true,
                    offsetCenter: ['-80%', -5],       // x, y，单位px
                    textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                        color: '#333',
                        fontSize : 15,
                        fontWeight: 'bolder'
                    }
                },
                detail : {
                    show : true,
                    backgroundColor: 'rgba(0,0,0,0)',
                    borderWidth: 0,
                    borderColor: '#ccc',
                    width: 100,
                    height: 40,
                    offsetCenter: ['-80%', -2],       // x, y，单位px
                    formatter:'{value}%',
                    textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                        color: 'red',
                        fontSize : 15,
                        fontWeight: 'bolder'
                    }
                },
                data:[{value: negative_percent[7]*100, name: stock_name[7]}]
            }
        ]
    };
    var myChart = echarts.init(document.getElementById('index'));
    myChart.setOption(option);
}
function draw_index5(stock_name,negative_percent){     
    var labelTop = {
        normal : {
            label : {
                show : true,
                position : 'center',
                textStyle: {
                    baseline : 'bottom'
                }
            },
            labelLine : {
                show : false
            }
        }
    };
    var labelBottom = {
        normal : {
            color: '#ccc',
            label : {
                show : true,
                position : 'center',
                formatter : function (a,b,c){return 100 - c + '%'},
                textStyle: {
                    baseline : 'top'
                }
            },
            labelLine : {
                show : false
            }
        },
        emphasis: {
            color: 'rgba(0,0,0,0)'
        }
    };
    var radius = [45, 60];
    var option = {
        tooltip: {
            formatter: "{a} <br/>{b} : {c}%"
        },
        title : {
            text: '',
            x: 'center'
        },
        series : [
            {
                name:stock_name[8],
                type:'gauge',
                center : ['35%', '50%'],    // 默认全局居中
                radius : radius,
                startAngle: 140,
                endAngle : -140,
                min: 0,                     // 最小值
                max: 100,                   // 最大值
                precision: 0,               // 小数精度，默认为0，无小数点
                splitNumber: 10,             // 分割段数，默认为5
                axisLine: {            // 坐标轴线
                    show: true,        // 默认显示，属性show控制显示与否
                    lineStyle: {       // 属性lineStyle控制线条样式
                        color: [[0.2, 'lightgreen'],[0.4, 'orange'],[0.8, 'skyblue'],[1, '#ff4500']], //划分区域，对不同的指标可以修改预警的数值范围
                        width: 15
                    }
                },
                axisTick: {            // 坐标轴小标记
                    show: true,        // 属性show控制显示与否，默认不显示
                    splitNumber: 5,    // 每份split细分多少段
                    length :5,         // 属性length控制线长
                    lineStyle: {       // 属性lineStyle控制线条样式
                        color: '#eee',
                        width: 1,
                        type: 'solid'
                    }
                },
                axisLabel: {           // 坐标轴文本标签，详见axis.axisLabel
                    show: true,
                    formatter: function(v){
                        switch (v+''){
                            case '10': return '弱';
                            case '30': return '低';
                            case '60': return '中';
                            case '90': return '高';
                            default: return '';
                        }
                    },
                    textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                        color: '#320',
                        fontSize : 10
                    }
                },
                splitLine: {           // 分隔线
                    show: true,        // 默认显示，属性show控制显示与否
                    length :10,         // 属性length控制线长
                    lineStyle: {       // 属性lineStyle（详见lineStyle）控制线条样式
                        color: '#eee',
                        width: 2,
                        type: 'solid'
                    }
                },
                pointer : {
                    length : '80%',
                    width : 8,
                    color : 'auto'
                },
                title : {
                    show : true,
                    offsetCenter: ['-80%', -5],       // x, y，单位px
                    textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                        color: '#333',
                        fontSize : 15,
                        fontWeight: 'bolder'
                    }
                },
                detail : {
                    show : true,
                    backgroundColor: 'rgba(0,0,0,0)',
                    borderWidth: 0,
                    borderColor: '#ccc',
                    width: 100,
                    height: 40,
                    offsetCenter: ['-80%', -2],       // x, y，单位px
                    formatter:'{value}%',
                    textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                        color: 'red',
                        fontSize : 15,
                        fontWeight: 'bolder'
                    }
                },
                data:[{value:negative_percent[8]*100, name:stock_name[8]}]
            },
            {
                name:stock_name[9],
                type:'gauge',
                center : ['70%', '50%'],    // 默认全局居中
                radius : radius,
                startAngle: 140,
                endAngle : -140,
                min: 0,                     // 最小值
                max: 100,                   // 最大值
                precision: 0,               // 小数精度，默认为0，无小数点
                splitNumber: 10,             // 分割段数，默认为5
                axisLine: {            // 坐标轴线
                    show: true,        // 默认显示，属性show控制显示与否
                    lineStyle: {       // 属性lineStyle控制线条样式
                        color: [[0.2, 'lightgreen'],[0.4, 'orange'],[0.8, 'skyblue'],[1, '#ff4500']], //划分区域，对不同的指标可以修改预警的数值范围
                        width: 15
                    }
                },
                axisTick: {            // 坐标轴小标记
                    show: true,        // 属性show控制显示与否，默认不显示
                    splitNumber: 5,    // 每份split细分多少段
                    length :5,         // 属性length控制线长
                    lineStyle: {       // 属性lineStyle控制线条样式
                        color: '#eee',
                        width: 1,
                        type: 'solid'
                    }
                },
                axisLabel: {           // 坐标轴文本标签，详见axis.axisLabel
                    show: true,
                    formatter: function(v){
                        switch (v+''){
                            case '10': return '弱';
                            case '30': return '低';
                            case '60': return '中';
                            case '90': return '高';
                            default: return '';
                        }
                    },
                    textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                        color: '#320',
                        fontSize : 10
                    }
                },
                splitLine: {           // 分隔线
                    show: true,        // 默认显示，属性show控制显示与否
                    length :10,         // 属性length控制线长
                    lineStyle: {       // 属性lineStyle（详见lineStyle）控制线条样式
                        color: '#eee',
                        width: 2,
                        type: 'solid'
                    }
                },
                pointer : {
                    length : '80%',
                    width : 8,
                    color : 'auto'
                },
                title : {
                    show : true,
                    offsetCenter: ['-80%', -5],       // x, y，单位px
                    textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                        color: '#333',
                        fontSize : 15,
                        fontWeight: 'bolder'
                    }
                },
                detail : {
                    show : true,
                    backgroundColor: 'rgba(0,0,0,0)',
                    borderWidth: 0,
                    borderColor: '#ccc',
                    width: 100,
                    height: 40,
                    offsetCenter: ['-80%', -2],       // x, y，单位px
                    formatter:'{value}%',
                    textStyle: {       // 其余属性默认使用全局文本样式，详见TEXTSTYLE
                        color: 'red',
                        fontSize : 15,
                        fontWeight: 'bolder'
                    }
                },
                data:[{value:negative_percent[9]*100, name: stock_name[9]}]
            }
        ]
    };
    var myChart = echarts.init(document.getElementById('index'));
    myChart.setOption(option);
}
var START_TS = 1378051200;
var END_TS = 1378569600;
var during = 3600*60;
var query = "股票";
var topk = 10;
var ts = 1412870400;
tl = new TrendsLine(query, START_TS, END_TS, during)
tl.initPullWeibos();
tl.initDrawWeibos();