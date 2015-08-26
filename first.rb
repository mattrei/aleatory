
live_loop :baz do
  tick
  density knit(1,3,2,1).look do
    sample :bd_haus, amp: factor?(look, 4) ? 3 : 2
    sleep 0.5
  end
end

live_loop :mel do
  ns = scale(:e, :major, num_octaves: 2)
  tick
  density 1 do
    synth :zawa, note: knit(:e1, 3, :c1, 1).look , cutoff: rrand(80, 120), phase: 1.25, wave: 1
    sleep 1
  end
end

live_loop :upbeat do
  sleep 0.5
  tick
  with_fx :slicer, wave: 0 do
    synth :piano, note: chord(:e3, :m7).choose, cutoff: range(80, 120, 5).look, vibrato_rate: 6, attack: 0.1, release: 0.3, sustain: 0.3, amp: rrand(0.5, 2)
  end 
  sleep 0.5
end
