package com.govjobindia.app

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.layout.padding
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavGraph.Companion.findStartDestination
import androidx.navigation.compose.*
import com.govjobindia.app.core.designsystem.GovJobTheme
import com.govjobindia.app.feature.details.DetailsScreen
import com.govjobindia.app.feature.jobs.*
import com.govjobindia.app.feature.search.SearchScreen
import dagger.hilt.android.AndroidEntryPoint

@AndroidEntryPoint class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) { super.onCreate(savedInstanceState); enableEdgeToEdge(); setContent { GovJobTheme { GovJobApp() } } }
}
private data class Destination(val route:String,val label:String,val icon:androidx.compose.ui.graphics.vector.ImageVector)
@Composable fun GovJobApp(vm: JobsViewModel = hiltViewModel()) {
    val state by vm.uiState.collectAsState(); val nav=rememberNavController(); val entry by nav.currentBackStackEntryAsState(); val current=entry?.destination?.route
    val destinations=listOf(Destination("home","Home",Icons.Default.Home),Destination("search","Search",Icons.Default.Search),Destination("saved","Saved",Icons.Default.Bookmark))
    Scaffold(bottomBar={if(current in destinations.map{it.route})NavigationBar{destinations.forEach{d->NavigationBarItem(current==d.route,{nav.navigate(d.route){popUpTo(nav.graph.findStartDestination().id){saveState=true};launchSingleTop=true;restoreState=true}}, {Icon(d.icon,d.label)},label={Text(d.label)})}}}){padding->NavHost(nav,"home",Modifier.padding(padding)){composable("home"){JobListScreen("GovJob India",state.jobs,state.loading,state.refreshing,state.sync?.lastSuccess,state.error,vm::refresh,{nav.navigate("details/$it")},vm::toggleSaved,"No job data is cached. Check your connection and retry.")};composable("search"){SearchScreen(state.jobs,{nav.navigate("details/$it")},vm::toggleSaved)};composable("saved"){JobListScreen("Saved jobs",state.saved,false,false,state.sync?.lastSuccess,null,vm::refresh,{nav.navigate("details/$it")},vm::toggleSaved,"Jobs you save appear here and remain available offline.")};composable("details/{id}"){back->val id=back.arguments?.getString("id");DetailsScreen((state.jobs+state.saved).find{it.id==id},{nav.popBackStack()})}}}
}
