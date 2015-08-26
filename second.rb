live_loop :b do

  tick
  sample :bd_klub, rate: 1
  sleep 0.25
  #with_fx :ixi_techno do
  with_fx :distortion do
    with_fx :krush do
      sample :bass_trance_c, rate: 4, attack: 0.1, release: 0.2, sustain: 0.2
    end
  end
  
  sleep 0.75

  
end


notes = ring(:c3, :g2, :a2, :a2, :eb3, :eb3, :eb3)
dur = knit(1, 5, 3, 1)
live_loop :b1 do
  
  notes.each do |n| 
    sleep 0.5
    #with_fx :wobble do
      with_fx :krush, gain: 1 do
        synth :zawa,  note: note(n, octave: 3), attack: 0.2, sustain: 0.1, cutoff: 100
      end
    #end
     
  end
  sleep 2
end
