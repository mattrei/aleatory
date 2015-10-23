require 'open-uri'
require 'json'
require 'csv'

KEY = 'LxSEb8IHR7'
SD = "&sender=#{KEY}"
URL = 'http://www.wienerlinien.at/ogd_realtime/' 
CSV_FILE = 'wienerlinien-ogd-steige.csv'

TIME_FORMAT = "%Y-%m-%dT%H:%M:%S"

U1_H=[4101,4103,4105,4107,4109,4111,4113,4115,4117,4119,4121,4123,4125,4127,4181,4182,4183,4184,4185]
U1_R=[4190,4189,4188,4187,4186,4102,4104,4106,4108,4110,4112,4114,4116,4118,4120,4122,4124,4126,4128]
U2_H=[4277,4278,4279,4251,4252,4253,4254,4256,4255,4257,4258,4259,4260,4261,4201,4203,4205,4209,4211,4213]
U2_R=[4202,4204,4206,4210,4212,4214,4262,4263,4264,4265,4266,4268,4267,4269,4270,4271,4272,4274,4275,4276]
U3_H=[4931,4932,4933,4926,4927,4921,4922,4923,4909,4910,4911,4912,4913,4914,4915,4916,4917,4934,4935,4936,4937]
U3_R=[4938,4939,4940,4941,4900,4901,4902,4903,4904,4905,4906,4907,4908,4918,4919,4920,4924,4925,4928,4929,4930]
U4_H=[4401,4403,4405,4407,4409,4411,4413,4437,4415,4417,4419,4421,4423,4425,4427,4429,4431,4433,4439,4435]
U4_R=[4402,4440,4404,4406,4408,4410,4412,4414,4416,4418,4420,4422,4438,4424,4426,4428,4430,4432,4434,4436]
U6_H=[4635,4636,4637,4638,4639,4640,4615,4616,4617,4618,4619,4620,4621,4622,4623,4624,4625,4626,4627,4641,4642,4643,4644,4645]
U6_R=[4646,4647,4648,4649,4650,4651,4603,4604,4605,4606,4607,4608,4609,4610,4611,4612,4613,4614,4629,4630,4631,4632,4633,4634]

def get_topology(rbls)
req = "?rbl=#{rbls.join("&rbl=")}#{SD}"
nodes = {}
open("#{URL}monitor#{req}") {|f|
    f.each_line do |line|
        j = JSON.parse(line)
        currTime = DateTime.parse(j['message']['serverTime'])
        j['data']['monitors'].each do |m|
            name = m['locationStop']['properties']['title']
            rbl = m['locationStop']['properties']['attributes']['rbl']
            coord = m['locationStop']['geometry']['coordinates']
            coord = {:lat => coord[1], :lng => coord[0]}
            nodes[rbl] = {:name => name, :coord => coord}
        end
    end
}
return nodes.sort_by { |k,v| rbls.index(k)} #.to_h
end

def get_live_data(rbls)
req = "?rbl=#{rbls.join("&rbl=")}#{SD}"
nodes = {}
graph = []
open("#{URL}monitor#{req}") {|f|
    f.each_line do |line|
        j = JSON.parse(line)
        currTime = DateTime.parse(j['message']['serverTime'])
        j['data']['monitors'].each do |m|
            name = m['locationStop']['properties']['title']
            rbl = m['locationStop']['properties']['attributes']['rbl']
            #puts m['lines'].length # metro always length 0
            dep = m['lines'][0]['departures']['departure'][0]['departureTime']['timePlanned']
            cnt = m['lines'][0]['departures']['departure'][0]['departureTime']['countdown']
            coord = m['locationStop']['geometry']['coordinates']
            coord = {:lat => coord[1], :lng => coord[0]}
            #puts m['locationStop']['properties']['title']

        	if not dep.nil?
	        	dep = DateTime.parse(dep)
	        else
	            dep = currTime
	        end

            nodes[rbl] = {:name => name, :dep => dep, :cnt => cnt, :coord => coord}

        end
     
        nodes = nodes.sort_by { |k,v| rbls.index(k)}.to_a
        
        for i in 0 ... nodes.size - 1
            t1 = nodes[i][1][:dep]
            t2 = nodes[i+1][1][:dep]
            if t1 > t2
                dur = ((t1 - t2) * 24 * 60 * 60).to_i
                elapsed = ((t2 - currTime) * 24 * 60 * 60).to_i
                cnt = nodes[i+1][1][:cnt] || 0
#                puts "#{nodes[i][1][:name]} - #{nodes[i+1][1][:name]} - cnt #{cnt} - dur #{dur}"
                graph.push({:a => nodes[i], :b => nodes[i+1], 
                :dur => dur, :cnt => cnt*60, :elapsed => elapsed})
            end
        end

    end
 }
 return graph
 end


def read_csv_topology

    #data = CSV.read('./wienerlinien-ogd-steige.csv')
    #puts "mat"
    #puts data
    nodes = {}
    line_name = 'to_be_removed'
    nodes[line_name] = {}
    File.foreach(CSV_FILE) do |l| 

        l = l.split(';')
        if l[4].tr('"', '').to_i == 1
            #rhfolge [4] rbl nummer [5]; steige [7]; lat, lng            
            nodes[line_name] = nodes[line_name].to_a
            line_name = l[7].tr('"','')

            nodes[line_name] = {}
        end
        #nodes[l[5].tr('"','')] = {:name => l[7].tr('"',''), :coord => {:lat => l[8], :lng => l[9]}}
        c = {}
        nodes[line_name][l[5].tr('"','')] = {:name => l[7].tr('"',''), :coord => {:lat => l[8], :lng => l[9]}}
    end

    #return nodes.sort_by { |k,v| rbls.index(k)} #.to_h
    return nodes.to_a[1 .. -1]
end

csv_top = read_csv_topology
#{:name => topology}
#puts csv_top.to_json

#a = get_live_data(U4_H)
#puts a.to_json
#sleep 10
#a = get_live_data(U4_H)
#puts a.to_json
#puts a = get_data(U4_R)

all = {:u4 => get_topology(U4_H), 
:u6 => get_topology(U6_H), :u3 => get_topology(U3_H),
:u2 => get_topology(U2_H), :u1 => get_topology(U1_H)}
puts all.to_json


