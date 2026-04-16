package com.iboplayer.next.data

import java.io.BufferedReader

object M3uParser {

    private val attrRegex = Regex("""([a-zA-Z0-9-]+)="([^"]*)"""")

    fun parse(reader: BufferedReader): List<Channel> {
        val channels = mutableListOf<Channel>()
        var pendingName: String? = null
        var pendingAttrs: Map<String, String> = emptyMap()
        var pendingGroup: String? = null
        var index = 0

        reader.useLines { lines ->
            for (raw in lines) {
                val line = raw.trim()
                if (line.isEmpty()) continue

                when {
                    line.startsWith("#EXTM3U") -> Unit

                    line.startsWith("#EXTINF") -> {
                        val commaIdx = line.indexOf(',')
                        val attrSection = if (commaIdx > 0) line.substring(0, commaIdx) else line
                        val title = if (commaIdx > 0) line.substring(commaIdx + 1).trim() else ""
                        val attrs = attrRegex.findAll(attrSection)
                            .associate { it.groupValues[1].lowercase() to it.groupValues[2] }
                        pendingAttrs = attrs
                        pendingName = attrs["tvg-name"]?.takeIf { it.isNotBlank() } ?: title
                        pendingGroup = attrs["group-title"]
                    }

                    line.startsWith("#EXTGRP:") -> {
                        pendingGroup = line.substringAfter(":").trim().ifBlank { pendingGroup }
                    }

                    line.startsWith("#") -> Unit

                    else -> {
                        val name = pendingName ?: continue
                        channels += Channel(
                            id = pendingAttrs["tvg-id"]?.takeIf { it.isNotBlank() }
                                ?: "${index}_${name.hashCode()}",
                            name = name,
                            url = line,
                            logo = pendingAttrs["tvg-logo"]?.takeIf { it.isNotBlank() },
                            group = pendingGroup?.takeIf { it.isNotBlank() },
                            tvgId = pendingAttrs["tvg-id"]?.takeIf { it.isNotBlank() },
                        )
                        index++
                        pendingName = null
                        pendingGroup = null
                        pendingAttrs = emptyMap()
                    }
                }
            }
        }

        return channels
    }
}
