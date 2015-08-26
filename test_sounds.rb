
live_loop :electric_signal do
  d = rand_i(4) + 1
  r = rrand 0.3, 1
  density d do
    with_fx :slicer, res: 0.9 do
      with_fx :nrhpf do
        synth :pulse, attack: 0.01, sustain: r, release: 0, cutoff: 100
        end
    end
  sleep r + 0.01
  end
end
