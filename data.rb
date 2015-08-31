require 'nokogiri'
require 'open-uri'
require 'mechanize'

URL="http://www.tdcj.state.tx.us/death_row/"

define :get_executed do

  page = Nokogiri::HTML(open("#{URL}dr_executed_offenders.html"))

  ages = 0
  puts "Count #{page.xpath('//tr').to_a[0..200].count / 60}"

  page.xpath('//tr').to_a[0..200].each do |tr|
    a = tr.children.to_a
    #puts "#{a[7].text} #{a[9].text} Age: #{a[13].text} Date #{a[15].text} - #{a[17].text}"
    ages += a[13].text.to_i
  end
  puts "Avarge age: #{ages / page.xpath('//tr').count}"

  puts page.xpath('//tr').select{|x| x.children.to_a[17].text == 'Black'}.count
  puts page.xpath('//tr').select{|x| x.children.to_a[17].text == 'White'}.count
  puts page.xpath('//tr').select{|x| x.children.to_a[17].text == 'Hispanic'}.count
end

#get_executed



arr = []
all_scheduled = false
in_thread(name: :scheduled_thread) do

  
    agent = Mechanize.new
    page = Nokogiri::HTML(open("#{URL}dr_scheduled_executions.html"))
    
    page.xpath('//tr').to_a.drop(1).each do |tr|
      a = tr.children.to_a
      link =  "http://www.tdcj.state.tx.us/death_row/#{a[3].children[0]['href']}"
      spage = Nokogiri::HTML(open(link))
      img = spage.css('img.photo_border_black_right')
      if !img.first.nil?
        puts "#{a[7].text} #{a[9].text} Birth: #{a[11].text} Race: #{a[13].text} #{a[1].text}"
        encoded_image = Base64.encode64 agent.get("#{URL}/dr_info/#{img.first['src']}").body_io.string
        puts encoded_image
        d = {}
        d[:img] = encoded_image
        d[:date] = a[1].text
        arr.push(d)
       puts "pushed"
      end
    end
    all_scheduled = true
 end



  require 'osc-ruby'

  def shader(endpoint, *args)
    puts "sha"
    @client ||= OSC::Client.new('localhost', 7400)
    begin
      args = args.map{|a| a.is_a?(Symbol) ? a.to_s : a}
      @client.send(OSC::Message.new(endpoint, *args))
    rescue Exception
      puts "$!> Graphics not loaded"
    end
  end

  shader(:page, "/TheScheduled")

  live_loop :dance do
    tick
    
    if all_scheduled
    
    print arr[look % arr.count]
    
      shader(:uniform, "img",  arr[look % arr.count][:img])
      shader(:uniform, "date", arr[look % arr.count][:date])
    end
    sleep 2
  end
