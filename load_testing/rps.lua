local keys = redis.call('keys', 'bull:requests-queue:*')
local timestamps = {}

-- Extract timestamps from JSON-like string
local function extract_timestamps(json_str)
    local timestamps = {}
    for match in json_str:gmatch('"timestamp":(%d+)') do
        table.insert(timestamps, tonumber(match))
    end
    return timestamps
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

for _, key in ipairs(keys) do
    if string.match(key, '^bull:requests%-queue:%d+$') then
        local finishedOn = tonumber(redis.call('hget', key, 'finishedOn'))
        local dataStr = redis.call('hget', key, 'data')
        local data = extract_timestamps(dataStr)

        if #data > 0 then
            for _, timestamp in ipairs(data) do
                table.insert(timestamps, timestamp)
            end
        end
    end
end

local sorted_timestamps = sort_table(timestamps)
local total_requests = #timestamps

if total_requests > 0 then
    local start_time = sorted_timestamps[1]
    local end_time = sorted_timestamps[#sorted_timestamps]
    local time_span_ms = end_time - start_time
    local time_span_sec = time_span_ms / 1000

    local requests_per_second = total_requests / time_span_sec

    return { requests_per_second }
else
    return { 0 }
end
