local keys = redis.call('keys', 'bull:requests-queue:*')
local totalFinishedTime = 0
local count = 0

-- Extract timestamps from JSON-like string
local function extract_timestamps(json_str)
    local timestamps = {}
    for match in json_str:gmatch('"timestamp":(%d+)') do
        table.insert(timestamps, tonumber(match))
    end
    return timestamps
end

for _, key in ipairs(keys) do
    if string.match(key, '^bull:requests%-queue:%d+$') then
        local finishedOn = redis.call('hget', key, 'finishedOn')
        local data = extract_timestamps(redis.call('hget', key, 'data'))

        local sum = 0
        local finishedTime = 0
        for _, timestamp in ipairs(data) do
            sum = sum + (finishedOn - timestamp)
        end

        finishedTime = sum / #data

        totalFinishedTime = totalFinishedTime + finishedTime

        count = count +1
    end
end

if count == 0 then
    return {0, 0}
  else
    local avgFinishedTime = totalFinishedTime / count
    return avgFinishedTime
  end