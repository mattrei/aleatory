
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

live_loop :a do
  stop
  r = rrand 0.3, 1
  with_fx :nrhpf, res: 0.9 do
    synth :noise, attack: 0.01, sustain: r, release: 0, cutoff: 120
  end
  sleep r + 0.01
end



live_loop :b do
  stop
  d = rand_i(4) + 2
  r = rrand 0.3, 1
  density d do
    with_fx :slicer, res: 0.9 do
      with_fx :nrhpf do
        synth :pulse, note: scale(:C, :minor_pentatonic).choose, attack: 0.01, sustain: r, release: 0, cutoff: 100
        end
    end
  sleep r + 0.01
  end
end

live_loop :c do
  r = rrand(0.25, 1)
  tick
  synth :mod_sine, note: scale(:C, :major).look, mod_range: 3, mod_phase: r, mod_invert_wave: 0, mod_wave: 0
  sleep r
end
