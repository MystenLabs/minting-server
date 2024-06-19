local keys = redis.call('keys', 'bull:requests-queue:*')
local differences = {}

local function extract_timestamps(json_str)
    local timestamps = {}
    for match in json_str:gmatch('"timestamp":(%d+)') do
        table.insert(timestamps, tonumber(match))
    end
    return timestamps
end

for _, key in ipairs(keys) do
    if string.match(key, '^bull:requests%-queue:%d+$') then
        local processedOn = redis.call('hget', key, 'processedOn')
        local data = extract_timestamps(redis.call('hget', key, 'data'))

        for _, timestamp in ipairs(data) do
            local difference = processedOn - timestamp
            table.insert(differences, difference)
        end
    end
end

local function sort_table(t)
    table.sort(t)
    return t
end

local function calculate_median(t)
    if #t == 0 then
        return 0
    end

    local sorted = sort_table(t)
    local middle = math.floor(#sorted / 2)

    if #sorted % 2 == 0 then
        return (sorted[middle] + sorted[middle + 1]) / 2
    else
        return sorted[middle + 1]
    end
end


local medianFinishedTime = calculate_median(differences)

return medianFinishedTime
