package com.govjobindia.app.core.designsystem

import androidx.compose.foundation.isSystemInDarkTheme
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.graphics.Color

private val Light = lightColorScheme(primary = Color(0xFF006C3B), secondary = Color(0xFF4E6355), tertiary = Color(0xFF3B6470))
private val Dark = darkColorScheme(primary = Color(0xFF5DDB8C), secondary = Color(0xFFB5CCBA), tertiary = Color(0xFFA2CEDD))
@Composable fun GovJobTheme(content: @Composable () -> Unit) = MaterialTheme(colorScheme = if (isSystemInDarkTheme()) Dark else Light, typography = Typography(), content = content)
